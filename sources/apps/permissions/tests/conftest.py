"""Fixtures del módulo de permisos.

``InMemoryAuthorizationRepository`` es un TEST DOUBLE del puerto
``AuthorizationRepository`` para tests unitarios de reglas/middleware.
NO sustituye al oráculo de BBDD del DoD: la persistencia real se valida
con tests sobre ``SqlAlchemyAuthorizationRepository``.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

import pytest

from apps.permissions.repository import SessionSnapshot, UserSnapshot
from apps.permissions.service import PermisoRuleService

FIXED_NOW = datetime(2026, 9, 30, 10, 0, 0)

EMPLEADO = "EMPLEADO"
TECNICO = "TECNICO_MANTENIMIENTO"
ADMIN = "ADMINISTRADOR"
ROL_FANTASMA = "ROL_FANTASMA"

MATRIX: dict[tuple[str, str], str] = {
    (EMPLEADO, "INCIDENT_CREATE"): "OWN",
    (EMPLEADO, "INCIDENT_LIST_OWN"): "OWN",
    (EMPLEADO, "INCIDENT_VIEW"): "OWN",
    (EMPLEADO, "INCIDENT_HISTORY_VIEW"): "OWN",
    (TECNICO, "INCIDENT_CREATE"): "OWN",
    (TECNICO, "INCIDENT_LIST_OWN"): "OWN",
    (TECNICO, "INCIDENT_LIST_ALL"): "ALL",
    (TECNICO, "INCIDENT_VIEW"): "ALL",
    (TECNICO, "INCIDENT_HISTORY_VIEW"): "ALL",
    (TECNICO, "INCIDENT_ASSIGN_SELF"): "ALL",
    (TECNICO, "INCIDENT_STATUS_CHANGE"): "ALL",
    (TECNICO, "INCIDENT_CLOSE_WITH_COMMENT"): "ALL",
    (ADMIN, "USER_MANAGE"): "ALL",
}


@dataclass
class StoredSession:
    snapshot: SessionSnapshot
    expires_at: datetime
    revoked_at: datetime | None = None
    last_activity_at: datetime | None = None


class InMemoryAuthorizationRepository:
    """Doble en memoria del protocolo AuthorizationRepository."""

    def __init__(self) -> None:
        self.sessions: dict[str, StoredSession] = {}
        self.users: dict[int, UserSnapshot] = {}
        self.active_roles: set[str] = set()
        self.matrix: dict[tuple[str, str], str] = {}
        self.touched: list[dict[str, Any]] = []
        self.denied: list[dict[str, Any]] = []

    # -- helpers de siembra ------------------------------------------- #
    def add_session(
        self,
        session_id: str,
        user_id: int,
        role_code: str,
        *,
        expires_at: datetime,
        revoked_at: datetime | None = None,
        permissions_refreshed_at: datetime | None = None,
    ) -> None:
        self.sessions[session_id] = StoredSession(
            snapshot=SessionSnapshot(
                session_id=session_id,
                user_id=user_id,
                role_code=role_code,
                permissions_refreshed_at=permissions_refreshed_at,
            ),
            expires_at=expires_at,
            revoked_at=revoked_at,
        )

    def add_user(
        self,
        user_id: int,
        role_code: str,
        status: str = "ACTIVO",
        role_changed_at: datetime | None = None,
    ) -> None:
        self.users[user_id] = UserSnapshot(
            user_id=user_id,
            role_code=role_code,
            status=status,
            role_changed_at=role_changed_at,
        )

    # -- protocolo ----------------------------------------------------- #
    def get_live_session(self, session_id: str, now: datetime) -> SessionSnapshot | None:
        stored = self.sessions.get(session_id)
        if stored is None or stored.revoked_at is not None or stored.expires_at <= now:
            return None
        return stored.snapshot

    def get_user(self, user_id: int) -> UserSnapshot | None:
        return self.users.get(user_id)

    def is_role_active(self, role_code: str) -> bool:
        return role_code in self.active_roles

    def find_data_scope(self, role_code: str, operation_code: str) -> str | None:
        if role_code not in self.active_roles:
            return None
        return self.matrix.get((role_code, operation_code))

    def touch_session(
        self, session_id: str, now: datetime, refresh_permissions: bool
    ) -> None:
        self.touched.append(
            {
                "session_id": session_id,
                "now": now,
                "refresh_permissions": refresh_permissions,
            }
        )
        stored = self.sessions.get(session_id)
        if stored is not None:
            stored.last_activity_at = now

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
        self.denied.append(
            {
                "user_id": user_id,
                "session_id": session_id,
                "operation": operation,
                "outcome": outcome,
                "occurred_at": occurred_at,
                "ip_address": ip_address,
                "user_agent": user_agent,
            }
        )


def seed_matrix(repo: InMemoryAuthorizationRepository) -> InMemoryAuthorizationRepository:
    """Datos de prueba: matriz acordada en el brief, usuarios y sesiones."""
    repo.matrix = dict(MATRIX)
    repo.active_roles = {EMPLEADO, TECNICO, ADMIN}

    repo.add_user(1, EMPLEADO, "ACTIVO")
    repo.add_user(2, TECNICO, "ACTIVO")
    repo.add_user(3, EMPLEADO, "INACTIVO")
    repo.add_user(4, ROL_FANTASMA, "ACTIVO")

    future = FIXED_NOW + timedelta(hours=8)
    repo.add_session("s-emp", 1, EMPLEADO, expires_at=future)
    repo.add_session("s-tec", 2, TECNICO, expires_at=future)
    repo.add_session("s-inactive", 3, EMPLEADO, expires_at=future)
    repo.add_session("s-unknown", 4, ROL_FANTASMA, expires_at=future)
    repo.add_session(
        "s-expired", 1, EMPLEADO, expires_at=FIXED_NOW - timedelta(minutes=1)
    )
    repo.add_session(
        "s-revoked",
        1,
        EMPLEADO,
        expires_at=future,
        revoked_at=FIXED_NOW - timedelta(minutes=5),
    )
    return repo


@pytest.fixture
def repo() -> InMemoryAuthorizationRepository:
    return seed_matrix(InMemoryAuthorizationRepository())


@pytest.fixture
def service_factory(repo: InMemoryAuthorizationRepository):
    # Reloj fijo: las sesiones se siembran relativas a FIXED_NOW.
    return lambda: (PermisoRuleService(None, repo, clock=lambda: FIXED_NOW), None)
