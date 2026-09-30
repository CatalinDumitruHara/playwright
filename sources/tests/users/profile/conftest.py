from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from apps.users.profile.auth import get_password_profile_repository
from apps.users.profile.models import SesionUsuarioEntity, UsuarioEntity
from apps.users.profile.passwords import PasswordHasherPort
from config.database import get_db, utc_now
from tests.users.profile.fakes import FakeDbSession, InMemoryPasswordProfileRepository

CURRENT_PASSWORD = "Actual-Pass-2026!"
AUTH = {"Authorization": "Bearer sess-current"}


def _session(session_id: str, user_id: int, now) -> SesionUsuarioEntity:
    return SesionUsuarioEntity(
        session_id=session_id,
        user_id=user_id,
        role_code="EMPLEADO",
        issued_at=now,
        expires_at=now + timedelta(hours=8),
        last_activity_at=now,
        revoked_at=None,
        revocation_reason=None,
    )


@pytest.fixture
def repo() -> InMemoryPasswordProfileRepository:
    now = utc_now()
    r = InMemoryPasswordProfileRepository()
    r.active_roles.update({"EMPLEADO", "TECNICO_MANTENIMIENTO", "ADMINISTRADOR"})
    r.users[1] = UsuarioEntity(
        user_id=1,
        full_name="Empleado Prueba",
        corporate_email="empleado@example.com",
        role_code="EMPLEADO",
        status="ACTIVO",
        password_hash=PasswordHasherPort().hash(CURRENT_PASSWORD),
        password_salt=None,
        password_algorithm="argon2id",
        password_updated_at=None,
        must_change_password="N",
        password_expires_at=None,
        failed_login_attempts=0,
        locked_until=None,
        created_at=now,
        updated_at=None,
        updated_by=None,
    )
    for sid in ("sess-current", "sess-other"):
        r.sessions[sid] = _session(sid, 1, now)
    return r


@pytest.fixture
def fake_db() -> FakeDbSession:
    return FakeDbSession()


@pytest.fixture
def client(repo, fake_db):
    from main import app

    app.dependency_overrides[get_db] = lambda: fake_db
    app.dependency_overrides[get_password_profile_repository] = lambda: repo
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
