"""Tests del AuthorizationMiddleware + require() montados con el composition root real.

El router de este módulo es un FIXTURE DE TEST que replica paths del contrato;
se monta mediante ``create_app`` (URL pública = "/api" + path del contrato).
"""
from __future__ import annotations

from datetime import timedelta

import pytest
from fastapi import APIRouter, Depends
from fastapi.testclient import TestClient

from apps.permissions.context import MSG_401, MSG_403, MSG_503, ContextoSesion
from apps.permissions.dependencies import require
from apps.permissions.repository import UserSnapshot
from apps.permissions.tests.conftest import ADMIN, EMPLEADO, FIXED_NOW, TECNICO
from main import create_app

calls: list[str] = []

router = APIRouter()


def _payload(name: str, ctx: ContextoSesion) -> dict:
    calls.append(name)
    return {
        "user_id": ctx.user_id,
        "role_code": ctx.role_code,
        "data_scope": ctx.data_scope.value,
    }


@router.get("/incidents")
def list_incidents(ctx: ContextoSesion = Depends(require("INCIDENT_LIST_ALL"))):
    return _payload("list_incidents", ctx)


@router.get("/my-incidents")
def list_my_incidents(ctx: ContextoSesion = Depends(require("INCIDENT_LIST_OWN"))):
    return _payload("list_my_incidents", ctx)


@router.post("/incidents", status_code=201)
def create_incident(ctx: ContextoSesion = Depends(require("INCIDENT_CREATE"))):
    return _payload("create_incident", ctx)


@router.get("/incidents/{incidentId}")
def view_incident(incidentId: int, ctx: ContextoSesion = Depends(require("INCIDENT_VIEW"))):
    return _payload("view_incident", ctx)


@router.post("/incidents/{incidentId}/assignment", status_code=201)
def assign_incident(
    incidentId: int, ctx: ContextoSesion = Depends(require("INCIDENT_ASSIGN_SELF"))
):
    return _payload("assign_incident", ctx)


@router.post("/incidents/{incidentId}/transitions", status_code=201)
def transition_incident(
    incidentId: int, ctx: ContextoSesion = Depends(require("INCIDENT_STATUS_CHANGE"))
):
    return _payload("transition_incident", ctx)


@router.post("/incidents/{incidentId}/closure", status_code=201)
def close_incident(
    incidentId: int, ctx: ContextoSesion = Depends(require("INCIDENT_CLOSE_WITH_COMMENT"))
):
    return _payload("close_incident", ctx)


@router.get("/users")
def list_users(ctx: ContextoSesion = Depends(require("USER_MANAGE"))):
    return _payload("list_users", ctx)


@router.get("/incident-statistics")
def incident_statistics():
    calls.append("incident_statistics")
    return {"ok": True}


@router.post("/auth/sessions", status_code=201)
def create_session():
    calls.append("create_session")
    return {"session": "new"}


def bearer(session: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {session}"}


@pytest.fixture(autouse=True)
def _reset_calls():
    calls.clear()
    yield
    calls.clear()


@pytest.fixture
def client(service_factory) -> TestClient:
    return TestClient(create_app(routers=[router], service_factory=service_factory))


# --------------------------------------------------------------------------- #


def test_ac_perm_01a_empleado_list_all_forbidden_and_audited(client, repo):
    """AC-PERM-01: EMPLEADO no puede listar todas las incidencias."""
    r = client.get("/api/incidents", headers=bearer("s-emp"))
    assert r.status_code == 403
    assert r.json()["detail"] == MSG_403
    assert calls == []
    assert len(repo.denied) == 1
    assert repo.denied[0]["outcome"] == "DENIED_403"
    assert repo.denied[0]["user_id"] == 1


def test_ac_perm_01b_empleado_list_own_ok(client):
    """AC-PERM-01: EMPLEADO lista sus incidencias con alcance OWN."""
    r = client.get("/api/my-incidents", headers=bearer("s-emp"))
    assert r.status_code == 200
    assert r.json() == {"user_id": 1, "role_code": EMPLEADO, "data_scope": "OWN"}
    assert calls == ["list_my_incidents"]


def test_ac_perm_01c_req_021_no_matrix_row_denies_without_touch(client, repo):
    """AC-PERM-01 / REQ-021: sin fila en la matriz para el rol ⇒ 403 y sin touch_session."""
    repo.add_user(5, ADMIN, "ACTIVO")
    repo.add_session("s-adm", 5, ADMIN, expires_at=FIXED_NOW + timedelta(hours=8))
    r = client.get("/api/incidents", headers=bearer("s-adm"))
    assert r.status_code == 403
    assert r.json()["detail"] == MSG_403
    assert repo.touched == []
    assert calls == []


def test_ac_perm_02_req_031_empleado_cannot_mutate(client):
    """AC-PERM-02 / REQ-031: EMPLEADO no asigna, transiciona ni cierra; sin efecto lateral."""
    for suffix in ("assignment", "transitions", "closure"):
        r = client.post(f"/api/incidents/10/{suffix}", headers=bearer("s-emp"))
        assert r.status_code == 403, suffix
        assert r.json()["detail"] == MSG_403
    assert calls == []


def test_ac_perm_02_req_009_tecnico_list_all_and_mutations(client):
    """AC-PERM-02 / REQ-009: TÉCNICO lista con filtros (ALL) y opera; identidad de la sesión."""
    r = client.get(
        "/api/incidents",
        params={"room": 1, "category": 2, "status": "ABIERTA"},
        headers=bearer("s-tec"),
    )
    assert r.status_code == 200
    assert r.json()["data_scope"] == "ALL"
    for suffix in ("assignment", "transitions", "closure"):
        r = client.post(f"/api/incidents/10/{suffix}", headers=bearer("s-tec"))
        assert r.status_code == 201, suffix
        assert r.json()["user_id"] == 2
        assert r.json()["role_code"] == TECNICO
    assert calls == [
        "list_incidents",
        "assign_incident",
        "transition_incident",
        "close_incident",
    ]


def test_ac_rol_01_role_and_identity_never_from_client(client):
    """AC-ROL-01: rol/alcance/identidad en query o cabeceras se ignoran."""
    r = client.get(
        "/api/my-incidents",
        params={"role": TECNICO, "data_scope": "ALL", "session_user_id": 2},
        headers={**bearer("s-emp"), "X-Role": TECNICO},
    )
    assert r.status_code == 200
    assert r.json() == {"user_id": 1, "role_code": EMPLEADO, "data_scope": "OWN"}

    r = client.get(
        "/api/incidents",
        params={"role": TECNICO},
        headers={**bearer("s-emp"), "X-Role": TECNICO},
    )
    assert r.status_code == 403


@pytest.mark.parametrize(
    "headers",
    [
        {},
        bearer("s-expired"),
        bearer("s-revoked"),
        bearer("no-existe"),
    ],
    ids=["sin-credencial", "expirada", "revocada", "desconocida"],
)
def test_401_invalid_or_missing_session(client, headers):
    """Sesión ausente, expirada, revocada o desconocida ⇒ 401."""
    r = client.get("/api/my-incidents", headers=headers)
    assert r.status_code == 401
    assert r.json()["detail"] == MSG_401
    assert calls == []


@pytest.mark.parametrize("session", ["s-inactive", "s-unknown"], ids=["inactivo", "rol-desconocido"])
def test_ac_rol_02_inactive_user_or_unknown_role_forbidden(client, session):
    """AC-ROL-02: usuario inactivo o rol no reconocido ⇒ 403."""
    r = client.get("/api/my-incidents", headers=bearer(session))
    assert r.status_code == 403
    assert r.json()["detail"] == MSG_403
    assert calls == []


def test_undeclared_operation_denied(client):
    """Endpoint sin require() ⇒ deny-by-default 403."""
    r = client.get("/api/incident-statistics", headers=bearer("s-tec"))
    assert r.status_code == 403
    assert calls == []


def test_cookie_session_auth(client):
    """La sesión también se acepta por cookie MIND_SESSION."""
    client.cookies.set("MIND_SESSION", "s-tec")
    r = client.get("/api/incidents")
    assert r.status_code == 200
    assert r.json()["user_id"] == 2


def test_ac_perm_05_role_change_applies_on_next_request(client, repo):
    """AC-PERM-05: el cambio de rol en BD se aplica a la siguiente petición con la misma sesión."""
    repo.users[1] = UserSnapshot(
        user_id=1, role_code=TECNICO, status="ACTIVO", role_changed_at=FIXED_NOW
    )
    r = client.get("/api/incidents", headers=bearer("s-emp"))
    assert r.status_code == 200
    assert r.json() == {"user_id": 1, "role_code": TECNICO, "data_scope": "ALL"}
    assert repo.touched[-1]["refresh_permissions"] is True

    repo.users[2] = UserSnapshot(
        user_id=2, role_code=EMPLEADO, status="ACTIVO", role_changed_at=FIXED_NOW
    )
    r = client.get("/api/incidents", headers=bearer("s-tec"))
    assert r.status_code == 403


def test_public_operation_without_credentials(client):
    """EP-001 POST /auth/sessions es público."""
    r = client.post("/api/auth/sessions")
    assert r.status_code == 201
    assert calls == ["create_session"]


def test_service_unavailable_returns_503():
    """Fallo al construir el servicio de autorización ⇒ 503 fail-closed."""

    def broken_factory():
        raise RuntimeError("db down")

    client = TestClient(create_app(routers=[router], service_factory=broken_factory))
    r = client.get("/api/my-incidents", headers=bearer("s-emp"))
    assert r.status_code == 503
    assert r.json()["detail"] == MSG_503
    assert calls == []
