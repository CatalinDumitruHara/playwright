"""PermisoRuleService: fuente única de verdad de la autorización (ARC-012).

La matriz rol/operación vive en ``permiso_rol_operacion``; aquí no hay
cadenas de if por rol u operación.
"""
from __future__ import annotations

from collections.abc import Callable
from contextlib import nullcontext
from datetime import datetime

import structlog
from sqlalchemy.orm import Session

from apps.permissions.context import (
    AuthorizationDecision,
    ContextoSesion,
    DataScope,
    Outcome,
)
from apps.permissions.database import get_session_factory, utc_now, uow
from apps.permissions.repository import (
    AuthorizationRepository,
    SessionSnapshot,
    SqlAlchemyAuthorizationRepository,
    UserSnapshot,
)

USER_STATUS_ACTIVE = "ACTIVO"
_VALID_SCOPES = frozenset(s.value for s in DataScope)

log = structlog.get_logger("permissions")


class PermisoRuleService:
    def __init__(
        self,
        db: Session | None,
        repo: AuthorizationRepository,
        clock: Callable[[], datetime] = utc_now,
    ) -> None:
        self.db = db
        self.repo = repo
        self.clock = clock

    def authorize(
        self,
        session_token: str | None,
        operation_code: str | None,
        *,
        request_path: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuthorizationDecision:
        ctx = uow(self.db) if self.db is not None else nullcontext()
        with ctx:
            decision = self._evaluate(
                session_token,
                operation_code,
                request_path=request_path,
                ip_address=ip_address,
                user_agent=user_agent,
            )
        return decision

    # ------------------------------------------------------------------ #

    def _evaluate(
        self,
        session_token: str | None,
        operation_code: str | None,
        *,
        request_path: str,
        ip_address: str | None,
        user_agent: str | None,
    ) -> AuthorizationDecision:
        now = self.clock()

        if not session_token:
            return self._deny_401(None, operation_code)
        session = self.repo.get_live_session(session_token, now)
        if session is None:
            return self._deny_401(None, operation_code)

        user = self.repo.get_user(session.user_id)
        if user is None:
            return self._deny_401(session.user_id, operation_code)

        # El rol SIEMPRE sale de BD (usuario), nunca de la sesión ni del cliente.
        role_code = user.role_code

        def deny_403() -> AuthorizationDecision:
            return self._deny_403(
                session=session,
                user=user,
                role_code=role_code,
                operation_code=operation_code,
                request_path=request_path,
                now=now,
                ip_address=ip_address,
                user_agent=user_agent,
            )

        if (
            user.status != USER_STATUS_ACTIVE
            or not role_code
            or not self.repo.is_role_active(role_code)
        ):
            return deny_403()

        if operation_code is None:
            return deny_403()

        scope = self.repo.find_data_scope(role_code, operation_code)
        if scope is None or scope not in _VALID_SCOPES:
            return deny_403()

        self.repo.touch_session(
            session.session_id,
            now,
            refresh_permissions=_needs_refresh(session, user, role_code),
        )
        log.info(
            "authorization_decision",
            session_user_id=user.user_id,
            role_code=role_code,
            operation_code=operation_code,
            outcome=Outcome.OK.value,
        )
        return AuthorizationDecision(
            Outcome.OK,
            ContextoSesion(
                session_id=session.session_id,
                user_id=user.user_id,
                role_code=role_code,
                data_scope=DataScope(scope),
                operation_code=operation_code,
            ),
            user.user_id,
            session.session_id,
        )

    def _deny_401(
        self, user_id: int | None, operation_code: str | None
    ) -> AuthorizationDecision:
        log.info(
            "authorization_decision",
            session_user_id=user_id,
            role_code=None,
            operation_code=operation_code,
            outcome=Outcome.DENIED_401.value,
        )
        return AuthorizationDecision(Outcome.DENIED_401)

    def _deny_403(
        self,
        *,
        session: SessionSnapshot,
        user: UserSnapshot,
        role_code: str,
        operation_code: str | None,
        request_path: str,
        now: datetime,
        ip_address: str | None,
        user_agent: str | None,
    ) -> AuthorizationDecision:
        try:
            self.repo.add_access_denied(
                user_id=user.user_id,
                session_id=session.session_id,
                operation=f"{operation_code or '-'} {request_path}",
                outcome=Outcome.DENIED_403.value,
                occurred_at=now,
                ip_address=ip_address,
                user_agent=user_agent,
            )
        except Exception as exc:  # auditoría best-effort: nunca cambia la decisión
            log.warning(
                "access_denied_audit_failed",
                session_user_id=user.user_id,
                operation_code=operation_code,
                error_type=type(exc).__name__,
            )
        log.info(
            "authorization_decision",
            session_user_id=user.user_id,
            role_code=role_code,
            operation_code=operation_code,
            outcome=Outcome.DENIED_403.value,
        )
        return AuthorizationDecision(
            Outcome.DENIED_403, None, user.user_id, session.session_id
        )


def _needs_refresh(session: SessionSnapshot, user: UserSnapshot, role_code: str) -> bool:
    return session.role_code != role_code and (
        session.permissions_refreshed_at is None
        or (
            user.role_changed_at is not None
            and session.permissions_refreshed_at < user.role_changed_at
        )
    )


def build_default_service() -> tuple[PermisoRuleService, Session]:
    """Servicio sobre una sesión nueva; el llamante cierra la sesión."""
    db = get_session_factory()()
    return PermisoRuleService(db, SqlAlchemyAuthorizationRepository(db)), db
