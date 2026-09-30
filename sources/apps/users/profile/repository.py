from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from apps.users.profile.models import (
    AuditoriaAccesoEntity,
    CatRolEntity,
    SesionUsuarioEntity,
    UsuarioEntity,
    UsuarioPasswordHistoricoEntity,
)

AUDIT_RETENTION_YEARS = 2
USER_AGENT_MAX_LENGTH = 255
REVOCATION_REASON_PASSWORD_CHANGE = "PASSWORD_CHANGE"


def _add_years(value: date, years: int) -> date:
    try:
        return value.replace(year=value.year + years)
    except ValueError:
        # 29 de febrero en año destino no bisiesto -> 28 de febrero
        return value.replace(year=value.year + years, day=28)


class PasswordProfileRepository:
    """Acceso a datos del cambio de contraseña. Nunca hace commit/rollback: la transacción es del servicio."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_active_session(self, session_id: str, now: datetime) -> SesionUsuarioEntity | None:
        stmt = select(SesionUsuarioEntity).where(
            SesionUsuarioEntity.session_id == session_id,
            SesionUsuarioEntity.revoked_at.is_(None),
            SesionUsuarioEntity.expires_at > now,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_user(self, user_id: int) -> UsuarioEntity | None:
        stmt = select(UsuarioEntity).where(UsuarioEntity.user_id == user_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_user_for_update(self, user_id: int) -> UsuarioEntity | None:
        stmt = select(UsuarioEntity).where(UsuarioEntity.user_id == user_id).with_for_update()
        return self.db.execute(stmt).scalar_one_or_none()

    def is_role_active(self, role_code: str) -> bool:
        stmt = select(CatRolEntity.role_code).where(
            CatRolEntity.role_code == role_code,
            CatRolEntity.is_active == "Y",
        )
        return self.db.execute(stmt).first() is not None

    def list_password_history_hashes(self, user_id: int, limit: int) -> list[str]:
        stmt = (
            select(UsuarioPasswordHistoricoEntity.password_hash)
            .where(UsuarioPasswordHistoricoEntity.user_id == user_id)
            .order_by(
                UsuarioPasswordHistoricoEntity.created_at.desc(),
                UsuarioPasswordHistoricoEntity.password_history_id.desc(),
            )
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())

    def add_password_history(self, user_id: int, password_hash: str, at: datetime) -> None:
        self.db.add(
            UsuarioPasswordHistoricoEntity(user_id=user_id, password_hash=password_hash, created_at=at)
        )

    def prune_password_history(self, user_id: int, keep: int) -> None:
        self.db.flush()
        kept_stmt = (
            select(UsuarioPasswordHistoricoEntity.password_history_id)
            .where(UsuarioPasswordHistoricoEntity.user_id == user_id)
            .order_by(
                UsuarioPasswordHistoricoEntity.created_at.desc(),
                UsuarioPasswordHistoricoEntity.password_history_id.desc(),
            )
            .limit(keep)
        )
        kept_ids = list(self.db.execute(kept_stmt).scalars().all())
        stmt = delete(UsuarioPasswordHistoricoEntity).where(
            UsuarioPasswordHistoricoEntity.user_id == user_id
        )
        if kept_ids:
            stmt = stmt.where(UsuarioPasswordHistoricoEntity.password_history_id.not_in(kept_ids))
        self.db.execute(stmt.execution_options(synchronize_session=False))

    def update_password(self, user: UsuarioEntity, password_hash: str, algorithm: str, at: datetime) -> None:
        user.password_hash = password_hash
        user.password_algorithm = algorithm
        user.password_salt = None  # argon2 embebe la sal en el hash
        user.password_updated_at = at
        user.must_change_password = "N"
        user.password_expires_at = None
        user.updated_at = at
        user.updated_by = user.user_id

    def revoke_other_sessions(self, user_id: int, keep_session_id: str, at: datetime) -> int:
        stmt = (
            update(SesionUsuarioEntity)
            .where(
                SesionUsuarioEntity.user_id == user_id,
                SesionUsuarioEntity.session_id != keep_session_id,
                SesionUsuarioEntity.revoked_at.is_(None),
            )
            .values(revoked_at=at, revocation_reason=REVOCATION_REASON_PASSWORD_CHANGE)
            .execution_options(synchronize_session=False)
        )
        result = self.db.execute(stmt)
        return int(result.rowcount or 0)

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
        self.db.add(
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
