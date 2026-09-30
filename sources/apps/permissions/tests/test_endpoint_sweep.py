"""AC-PERM-03: barrido de endpoints contra el composition root real.

Se construye la app con ``create_app(service_factory=...)`` SIN routers de
funcionalidad (ninguno se monta en TSK-003): todo endpoint del contrato, y
cualquier ruta no documentada, debe quedar denegado (deny-by-default) con
cuerpo uniforme, sin 2xx ni 404/405 que revelen existencia.

El ``service_factory`` usa el doble en memoria del repositorio (conftest):
valida la regla del middleware, NO la persistencia (ver test_repository_sql).
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest
import yaml
from fastapi.testclient import TestClient

from apps.permissions.context import MSG_401, MSG_403
from main import create_app

OPENAPI_PATH = Path(__file__).resolve().parents[4] / "openapi.yaml"
HTTP_METHODS = ("get", "post", "put", "patch", "delete")
PUBLIC = {("POST", "/auth/sessions")}  # EP-001


def _load_contract_operations() -> list[tuple[str, str, str]]:
    spec = yaml.safe_load(OPENAPI_PATH.read_text(encoding="utf-8"))
    base = spec["servers"][0]["url"].rstrip("/")
    ops: list[tuple[str, str, str]] = []
    for path, item in spec["paths"].items():
        for method, op in item.items():
            if method not in HTTP_METHODS:
                continue
            concrete = re.sub(r"\{[^}]+\}", "1", path)
            ops.append((method.upper(), path, base + concrete))
    return ops


CONTRACT_OPS = _load_contract_operations()
PROTECTED_OPS = [op for op in CONTRACT_OPS if (op[0], op[1]) not in PUBLIC]
PUBLIC_OPS = [op for op in CONTRACT_OPS if (op[0], op[1]) in PUBLIC]

UNDOCUMENTED_PATHS = (
    "/api/admin",
    "/api/users/1/role?role=ADMINISTRADOR",
    "/api/internal/debug",
    "/api/../etc/passwd",
    "/docs",
    "/openapi.json",
)
UNDOCUMENTED_METHODS = ("GET", "POST", "PUT", "DELETE")
UNDOCUMENTED = [(m, p) for p in UNDOCUMENTED_PATHS for m in UNDOCUMENTED_METHODS]

EMP_HEADERS = {"Authorization": "Bearer s-emp"}


@pytest.fixture
def client(service_factory) -> TestClient:
    app = create_app(service_factory=service_factory)
    return TestClient(app, raise_server_exceptions=False)


def _op_id(op: tuple[str, str, str]) -> str:
    return f"{op[0]} {op[1]}"


def test_ac_perm_03_contract_is_loaded():
    # El contrato tiene 56 operaciones (EP-001..EP-056); 1 pública.
    assert len(CONTRACT_OPS) == 56
    assert len(PUBLIC_OPS) == 1
    assert len(PROTECTED_OPS) == 55


# --------------------------------------------------------------------------- #
# Endpoints del contrato con EMPLEADO autenticado
# --------------------------------------------------------------------------- #


@pytest.mark.parametrize("op", PROTECTED_OPS, ids=_op_id)
def test_ac_perm_03_contract_endpoint_denied_403_for_empleado(client, op):
    method, _template, url = op
    resp = client.request(method, url, headers=EMP_HEADERS)
    assert not 200 <= resp.status_code < 300
    assert resp.status_code == 403
    assert resp.json() == {"detail": MSG_403}


@pytest.mark.parametrize("op", PUBLIC_OPS, ids=_op_id)
def test_ac_perm_03_public_ep001_not_mounted_is_not_2xx(client, op):
    method, _template, url = op
    resp = client.request(method, url, headers=EMP_HEADERS)
    assert not 200 <= resp.status_code < 300
    assert resp.status_code in (401, 403)


# --------------------------------------------------------------------------- #
# Rutas no documentadas
# --------------------------------------------------------------------------- #


@pytest.mark.parametrize(("method", "path"), UNDOCUMENTED, ids=lambda v: v)
def test_ac_perm_03_undocumented_path_denied_403_uniform(client, method, path):
    resp = client.request(method, path, headers=EMP_HEADERS)
    assert not 200 <= resp.status_code < 300
    assert resp.status_code not in (404, 405)
    assert resp.status_code == 403
    assert resp.json() == {"detail": MSG_403}


# --------------------------------------------------------------------------- #
# Sin credenciales ⇒ 401
# --------------------------------------------------------------------------- #


@pytest.mark.parametrize("op", CONTRACT_OPS, ids=_op_id)
def test_ac_perm_03_contract_endpoint_without_credentials_401(client, op):
    method, _template, url = op
    resp = client.request(method, url)
    assert not 200 <= resp.status_code < 300
    assert resp.status_code == 401
    assert resp.json() == {"detail": MSG_401}
    assert resp.headers.get("www-authenticate") == "Bearer"


@pytest.mark.parametrize(("method", "path"), UNDOCUMENTED, ids=lambda v: v)
def test_ac_perm_03_undocumented_path_without_credentials_401(client, method, path):
    resp = client.request(method, path)
    assert not 200 <= resp.status_code < 300
    assert resp.status_code == 401
    assert resp.json() == {"detail": MSG_401}


# --------------------------------------------------------------------------- #
# App de módulo (composition root productivo, factoría por defecto)
# --------------------------------------------------------------------------- #


def test_ac_perm_03_module_app_without_credentials_401():
    from main import app

    resp = TestClient(app, raise_server_exceptions=False).get("/api/incidents")
    assert resp.status_code == 401
    assert resp.json() == {"detail": MSG_401}
