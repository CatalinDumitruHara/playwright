"""Dobles de prueba en memoria para el cambio de contraseña (sin BBDD disponible en el entorno)."""
from datetime import datetime
from uuid import uuid4

from apps.users.profile.models import (
    AuditoriaAccesoEntity,
    SesionUsuarioEntity,
    UsuarioEntity,
    UsuarioPasswordHistoricoEntity,
)
from apps.users.profile.repository import (
    REVOCATION_REASON_PASSWORD_CHANGE,
    USER_AGENT_MAX_LENGTH,
    AUDIT_RETENTION_YEARS,
    _add_years,
)


class FakeDbSession:
    def __init__(self) -> None:
        self.commits = 0
        self.rollbacks = 0
        self.closed = False

    def commit(self) -> None:
        self.commits += 1

    def rollback(self) -> None:
        self.rollbacks += 1

    def close(self) -> None:
        self.closed = True


class InMemoryPasswordProfileRepository:
    """Misma interfaz pública que PasswordProfileRepository, respaldada por colecciones en memoria."""

    def __init__(self) -> None:
        self.users: dict[int, UsuarioEntity] = {}
        self.sessions: dict[str, SesionUsuarioEntity] = {}
        self.active_roles: set[str] = set()
        self.history: list[UsuarioPasswordHistoricoEntity] = []
        self.audits: list[AuditoriaAccesoEntity] = []
        self.writes: list[str] = []
        self.locked_user_ids: list[int] = []
        self._next_history_id = 1

    def get_active_session(self, session_id: str, now: datetime) -> SesionUsuarioEntity | None:
        s = self.sessions.get(session_id)
        if s is None or s.revoked_at is not None or not (s.expires_at > now):
            return None
        return s

    def get_user(self, user_id: int) -> UsuarioEntity | None:
        return self.users.get(user_id)

    def get_user_for_update(self, user_id: int) -> UsuarioEntity | None:
        self.locked_user_ids.append(user_id)
        return self.users.get(user_id)

    def is_role_active(self, role_code: str) -> bool:
        return role_code in self.active_roles

    def _sorted_history(self, user_id: int) -> list[UsuarioPasswordHistoricoEntity]:
        return sorted(
            (h for h in self.history if h.user_id == user_id),
            key=lambda h: (h.created_at, h.password_history_id),
            reverse=True,
        )

    def list_password_history_hashes(self, user_id: int, limit: int) -> list[str]:
        return [h.password_hash for h in self._sorted_history(user_id)[:limit]]

    def add_password_history(self, user_id: int, password_hash: str, at: datetime) -> None:
        self.history.append(
            UsuarioPasswordHistoricoEntity(
                password_history_id=self._next_history_id,
                user_id=user_id,
                password_hash=password_hash,
                created_at=at,
            )
        )
        self._next_history_id += 1
        self.writes.append("add_password_history")

    def prune_password_history(self, user_id: int, keep: int) -> None:
        kept_ids = {h.password_history_id for h in self._sorted_history(user_id)[:keep]}
        self.history = [
            h for h in self.history if h.user_id != user_id or h.password_history_id in kept_ids
        ]
        self.writes.append("prune_password_history")

    def update_password(self, user: UsuarioEntity, password_hash: str, algorithm: str, at: datetime) -> None:
        user.password_hash = password_hash
        user.password_algorithm = algorithm
        user.password_salt = None
        user.password_updated_at = at
        user.must_change_password = "N"
        user.password_expires_at = None
        user.updated_at = at
        user.updated_by = user.user_id
        self.writes.append("update_password")

    def revoke_other_sessions(self, user_id: int, keep_session_id: str, at: datetime) -> int:
        count = 0
        for s in self.sessions.values():
            if s.user_id == user_id and s.session_id != keep_session_id and s.revoked_at is None:
                s.revoked_at = at
                s.revocation_reason = REVOCATION_REASON_PASSWORD_CHANGE
                count += 1
        self.writes.append("revoke_other_sessions")
        return count

    def add_access_audit(
        self,
        *,
        user_id: int,
        session_id: str,
        event_type: str,
        operation: str,
        outcome: str,
        at: datetime,
        ip_address: str | None,
        user_agent: str | None,
    ) -> None:
        self.audits.append(
            AuditoriaAccesoEntity(
                audit_id=str(uuid4()),
                user_id=user_id,
                event_type=event_type,
                operation=operation,
                outcome=outcome,
                occurred_at=at,
                ip_address=ip_address,
                user_agent=user_agent[:USER_AGENT_MAX_LENGTH] if user_agent is not None else None,
                session_id=session_id,
                retention_until=_add_years(at.date(), AUDIT_RETENTION_YEARS),
            )
        )
        self.writes.append("add_access_audit")
