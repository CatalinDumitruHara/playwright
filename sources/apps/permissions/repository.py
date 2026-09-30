"""Acceso a datos de la autorización (puerto + adaptador SQLAlchemy 2).

El repositorio NUNCA hace commit/rollback/flush: la transacción la gobierna
el servicio con ``uow``.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Protocol
from uuid import uuid4

from sqlalchemy import Select, select, update
from sqlalchemy.orm import Session

from apps.permissions.models import (
    AuditoriaAcceso,
    CatOperacion,
    CatRol,
    PermisoRolOperacion,
    SesionUsuarioAuth,
    UsuarioAuth,
)

EVENT_PERMISSION_DENIED = "PERMISSION_DENIED"
RETENTION_YEARS = 2
_OPERATION_MAX = 100
_USER_AGENT_MAX = 255


@dataclass(frozen=True)
class SessionSnapshot:
    session_id: str
    user_id: int
    role_code: str
    permissions_refreshed_at: datetime | None


@dataclass(frozen=True)
class UserSnapshot:
    user_id: int
    role_code: str
    status: str
    role_changed_at: datetime | None


class AuthorizationRepository(Protocol):
    def get_live_session(self, session_id: str, now: datetime) -> SessionSnapshot | None: ...

    def get_user(self, user_id: int) -> UserSnapshot | None: ...

    def is_role_active(self, role_code: str) -> bool: ...

    def find_data_scope(self, role_code: str, operation_code: str) -> str | None: ...

    def touch_session(
        self, session_id: str, now: datetime, refresh_permissions: bool
    ) -> None: ...

    def add_access_denied(
        self,
        *,
        user_id: int | None,
        session_id: str | None,
        operation: str,
        outcome: str,
        occurred_at: datetime,
        ip_address: str | None,
        user_agent: str | None,
    ) -> None: ...


def data_scope_stmt(role_code: str, operation_code: str) -> Select[tuple[str]]:
    """SELECT del alcance de datos para (rol, operación), solo catálogos activos."""
    return (
        select(PermisoRolOperacion.data_scope)
        .join(
            CatOperacion,
            CatOperacion.operation_code == PermisoRolOperacion.operation_code,
        )
        .join(CatRol, CatRol.role_code == PermisoRolOperacion.role_code)
        .where(
            PermisoRolOperacion.role_code == role_code,
            PermisoRolOperacion.operation_code == operation_code,
            CatOperacion.is_active == "Y",
            CatRol.is_active == "Y",
        )
    )


def retention_date(occurred_at: datetime, years: int = RETENTION_YEARS) -> date:
    """``occurred_at + years`` como fecha; 29-feb pasa a 28-feb si el año destino no es bisiesto."""
    d = occurred_at.date()
    try:
        return d.replace(year=d.year + years)
    except ValueError:
        return d.replace(year=d.year + years, day=28)


def _truncate(value: str | None, max_len: int) -> str | None:
    return value[:max_len] if value is not None else None


class SqlAlchemyAuthorizationRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_live_session(self, session_id: str, now: datetime) -> SessionSnapshot | None:
        row = self._db.execute(
            select(
                SesionUsuarioAuth.session_id,
                SesionUsuarioAuth.user_id,
                SesionUsuarioAuth.role_code,
                SesionUsuarioAuth.permissions_refreshed_at,
            ).where(
                SesionUsuarioAuth.session_id == session_id,
                SesionUsuarioAuth.revoked_at.is_(None),
                SesionUsuarioAuth.expires_at > now,
            )
        ).first()
        if row is None:
            return None
        return SessionSnapshot(
            session_id=row.session_id,
            user_id=row.user_id,
            role_code=row.role_code,
            permissions_refreshed_at=row.permissions_refreshed_at,
        )

    def get_user(self, user_id: int) -> UserSnapshot | None:
        row = self._db.execute(
            select(
                UsuarioAuth.user_id,
                UsuarioAuth.role_code,
                UsuarioAuth.status,
                UsuarioAuth.role_changed_at,
            ).where(UsuarioAuth.user_id == user_id)
        ).first()
        if row is None:
            return None
        return UserSnapshot(
            user_id=row.user_id,
            role_code=row.role_code,
            status=row.status,
            role_changed_at=row.role_changed_at,
        )

    def is_role_active(self, role_code: str) -> bool:
        found = self._db.execute(
            select(CatRol.role_code).where(
                CatRol.role_code == role_code, CatRol.is_active == "Y"
            )
        ).first()
        return found is not None

    def find_data_scope(self, role_code: str, operation_code: str) -> str | None:
        return self._db.execute(data_scope_stmt(role_code, operation_code)).scalars().first()

    def touch_session(
        self, session_id: str, now: datetime, refresh_permissions: bool
    ) -> None:
        values: dict[str, datetime] = {"last_activity_at": now}
        if refresh_permissions:
            values["permissions_refreshed_at"] = now
        self._db.execute(
            update(SesionUsuarioAuth)
            .where(SesionUsuarioAuth.session_id == session_id)
            .values(**values)
        )

    def add_access_denied(
        self,
        *,
        user_id: int | None,
        session_id: str | None,
        operation: str,
        outcome: str,
        occurred_at: datetime,
        ip_address: str | None,
        user_agent: str | None,
    ) -> None:
        self._db.add(
            AuditoriaAcceso(
                audit_id=str(uuid4()),
                user_id=user_id,
                event_type=EVENT_PERMISSION_DENIED,
                operation=_truncate(operation, _OPERATION_MAX),
                outcome=outcome,
                occurred_at=occurred_at,
                ip_address=ip_address,
                user_agent=_truncate(user_agent, _USER_AGENT_MAX),
                session_id=session_id,
                retention_until=retention_date(occurred_at),
            )
        )
