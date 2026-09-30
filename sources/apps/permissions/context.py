"""Contexto de autorización y resultado de la decisión (ARC-012)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

MSG_401 = "Sesión no válida o expirada"
MSG_403 = "No tiene permisos para realizar esta acción"
MSG_503 = "El servicio de autorización no está disponible"


class DataScope(str, Enum):
    OWN = "OWN"
    ALL = "ALL"


@dataclass(frozen=True)
class ContextoSesion:
    session_id: str
    user_id: int
    role_code: str
    data_scope: DataScope
    operation_code: str


class Outcome(str, Enum):
    OK = "OK"
    DENIED_401 = "DENIED_401"
    DENIED_403 = "DENIED_403"


@dataclass(frozen=True)
class AuthorizationDecision:
    outcome: Outcome
    contexto: ContextoSesion | None = None
    user_id: int | None = None
    session_id: str | None = None

    @property
    def allowed(self) -> bool:
        return self.outcome is Outcome.OK
