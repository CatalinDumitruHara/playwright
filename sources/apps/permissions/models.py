"""Mapeos SQLAlchemy 2 (lectura) de las tablas que usa la autorización.

El esquema lo crea la migración T.5; este módulo NUNCA crea tablas
(no se llama a ``PermBase.metadata.create_all``). Nombres físicos exactos
de Oracle; marcas temporales naive UTC (``DateTime(timezone=False)``).
"""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Identity,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class PermBase(DeclarativeBase):
    pass


class CatRol(PermBase):
    __tablename__ = "cat_rol"

    role_code: Mapped[str] = mapped_column(String(32), primary_key=True)
    role_name: Mapped[str] = mapped_column(String(60), nullable=False)
    role_description: Mapped[str | None] = mapped_column(String(200), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[str] = mapped_column(String(1), nullable=False)


class CatOperacion(PermBase):
    __tablename__ = "cat_operacion"

    operation_code: Mapped[str] = mapped_column(String(50), primary_key=True)
    operation_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[str] = mapped_column(String(1), nullable=False)


class PermisoRolOperacion(PermBase):
    __tablename__ = "permiso_rol_operacion"
    __table_args__ = (UniqueConstraint("role_code", "operation_code"),)

    permiso_id: Mapped[int] = mapped_column(
        Integer, Identity(always=True), primary_key=True
    )
    role_code: Mapped[str] = mapped_column(
        String(32), ForeignKey("cat_rol.role_code"), nullable=False
    )
    operation_code: Mapped[str] = mapped_column(
        String(50), ForeignKey("cat_operacion.operation_code"), nullable=False
    )
    data_scope: Mapped[str] = mapped_column(String(10), nullable=False)


class UsuarioAuth(PermBase):
    """Subconjunto de ``usuario`` necesario para autorizar (solo lectura)."""

    __tablename__ = "usuario"

    user_id: Mapped[int] = mapped_column(
        Integer, Identity(always=True), primary_key=True
    )
    role_code: Mapped[str] = mapped_column(
        String(32), ForeignKey("cat_rol.role_code"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(10), nullable=False)
    role_changed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=False), nullable=True
    )


class SesionUsuarioAuth(PermBase):
    """Subconjunto de ``sesion_usuario`` necesario para autorizar."""

    __tablename__ = "sesion_usuario"

    session_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("usuario.user_id"), nullable=False
    )
    role_code: Mapped[str] = mapped_column(String(32), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), nullable=False
    )
    permissions_refreshed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=False), nullable=True
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=False), nullable=True
    )
    revocation_reason: Mapped[str | None] = mapped_column(String(30), nullable=True)


class AuditoriaAcceso(PermBase):
    __tablename__ = "auditoria_acceso"

    audit_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("usuario.user_id"), nullable=True
    )
    username_attempted: Mapped[str | None] = mapped_column(String(150), nullable=True)
    event_type: Mapped[str] = mapped_column(String(30), nullable=False)
    operation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    outcome: Mapped[str] = mapped_column(String(20), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    session_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("sesion_usuario.session_id"), nullable=True
    )
    retention_until: Mapped[date] = mapped_column(Date, nullable=False)
