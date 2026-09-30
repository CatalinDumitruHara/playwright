"""Tests de API de PUT /api/auth/password (EP-005)."""

URL = "/api/auth/password"


def test_sin_authorization_devuelve_401_unauthenticated(client):
    resp = client.put(
        URL,
        json={
            "current_password": "Actual-Pass-2026!",
            "new_password": "Nueva-Pass-2026!",
            "new_password_confirmation": "Nueva-Pass-2026!",
        },
    )
    assert resp.status_code == 401
    assert resp.json()["code"] == "UNAUTHENTICATED"
