"""SQL del repositorio real ``SqlAlchemyAuthorizationRepository`` (dialecto Oracle).

Sin BBDD Oracle disponible en esta sesión: se verifica el SQL compilado con el
dialecto Oracle (SQLite/H2 prohibidos) y el contrato de no-commit con un
``MagicMock(spec=Session)``. Esto NO sustituye un test de integración contra
Oracle real (pendiente de entorno).
"""
from __future__ import annotations

import re
from datetime import date, datetime
from unittest.mock import MagicMock

from sqlalchemy.dialects import oracle
from sqlalchemy.orm import Session

from apps.permissions.models import AuditoriaAcceso
from apps.permissions.repository import (
    EVENT_PERMISSION_DENIED,
    SqlAlchemyAuthorizationRepository,
    data_scope_stmt,
    retention_date,
)


def _compile(stmt) -> tuple[str, dict]:
    compiled = stmt.compile(dialect=oracle.dialect())
    sql = re.sub(r"\s+", " ", str(compiled)).lower()
    return sql, dict(compiled.params)


def test_data_scope_stmt_oracle_selects_data_scope():
    sql, _ = _compile(data_scope_stmt("EMPLEADO", "INCIDENT_LIST_OWN"))
    assert sql.startswith("select permiso_rol_operacion.data_scope from permiso_rol_operacion")


def test_data_scope_stmt_oracle_joins_catalogs():
    sql, _ = _compile(data_scope_stmt("EMPLEADO", "INCIDENT_LIST_OWN"))
    assert (
        "join cat_operacion on cat_operacion.operation_code = "
        "permiso_rol_operacion.operation_code" in sql
    )
    assert "join cat_rol on cat_rol.role_code = permiso_rol_operacion.role_code" in sql


def test_data_scope_stmt_oracle_filters_active_catalogs_and_keys():
    sql, params = _compile(data_scope_stmt("EMPLEADO", "INCIDENT_LIST_OWN"))
    where = sql.split(" where ", 1)[1]
    assert re.search(r"permiso_rol_operacion\.role_code = :\w+", where)
    assert re.search(r"permiso_rol_operacion\.operation_code = :\w+", where)
    assert re.search(r"cat_operacion\.is_active = :\w+", where)
    assert re.search(r"cat_rol\.is_active = :\w+", where)
    values = list(params.values())
    assert "EMPLEADO" in values
    assert "INCIDENT_LIST_OWN" in values
    assert values.count("Y") == 2


def test_retention_date_leap_day_falls_back_to_feb_28():
    assert retention_date(datetime(2024, 2, 29, 12, 0)) == date(2026, 2, 28)


def test_retention_date_regular_date_plus_two_years():
    assert retention_date(datetime(2026, 9, 30, 10, 0)) == date(2028, 9, 30)


def test_add_access_denied_adds_audit_row_without_committing():
    db = MagicMock(spec=Session)
    repo = SqlAlchemyAuthorizationRepository(db)
    occurred = datetime(2026, 9, 30, 10, 0, 0)

    repo.add_access_denied(
        user_id=1,
        session_id="s-emp",
        operation="X" * 150,
        outcome="DENIED_403",
        occurred_at=occurred,
        ip_address="10.0.0.1",
        user_agent="UA" * 200,
    )

    db.add.assert_called_once()
    row = db.add.call_args.args[0]
    assert isinstance(row, AuditoriaAcceso)
    assert row.event_type == EVENT_PERMISSION_DENIED == "PERMISSION_DENIED"
    assert row.outcome == "DENIED_403"
    assert row.operation == "X" * 100
    assert len(row.user_agent) == 255
    assert row.user_id == 1
    assert row.session_id == "s-emp"
    assert row.ip_address == "10.0.0.1"
    assert row.occurred_at == occurred
    assert row.retention_until == date(2028, 9, 30)
    assert row.audit_id and len(row.audit_id) == 36

    db.commit.assert_not_called()
    db.rollback.assert_not_called()
    db.flush.assert_not_called()
