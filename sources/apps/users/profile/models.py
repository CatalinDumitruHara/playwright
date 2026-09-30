from datetime import date, datetime

from sqlalchemy import TIMESTAMP, Date, ForeignKey, Identity, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from config.database import Base


class UsuarioEntity(Base):
    __tablename__ = "usuario"

    user_id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    corporate_email: Mapped[str] = mapped_column(String(150), nullable=False)
    role_code: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(10), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    password_salt: Mapped[str | None] = mapped_column(String(64), nullable=True)
    password_algorithm: Mapped[str] = mapped_column(String(30), nullable=False)
    password_updated_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=False), nullable=True)
    must_change_password: Mapped[str] = mapped_column(String(1), nullable=False)
    password_expires_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=False), nullable=True)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=False), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=False), nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=False), nullable=True)
    updated_by: Mapped[int | None] = mapped_column(Integer, nullable=True)


class UsuarioPasswordHistoricoEntity(Base):
    __tablename__ = "usuario_password_historico"

    password_history_id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuario.user_id"), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=False), nullable=False)


class SesionUsuarioEntity(Base):
    __tablename__ = "sesion_usuario"

    session_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuario.user_id"), nullable=False)
    role_code: Mapped[str] = mapped_column(String(32), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=False), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=False), nullable=False)
    last_activity_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=False), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=False), nullable=True)
    revocation_reason: Mapped[str | None] = mapped_column(String(30), nullable=True)


class CatRolEntity(Base):
    __tablename__ = "cat_rol"

    role_code: Mapped[str] = mapped_column(String(32), primary_key=True)
    role_name: Mapped[str] = mapped_column(String(60), nullable=False)
    is_active: Mapped[str] = mapped_column(String(1), nullable=False)


class AuditoriaAccesoEntity(Base):
    __tablename__ = "auditoria_acceso"

    audit_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("usuario.user_id"), nullable=True)
    username_attempted: Mapped[str | None] = mapped_column(String(150), nullable=True)
    event_type: Mapped[str] = mapped_column(String(30), nullable=False)
    operation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    outcome: Mapped[str] = mapped_column(String(20), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=False), nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    retention_until: Mapped[date] = mapped_column(Date, nullable=False)
