"""Declaración de la operación de cada endpoint (ARC-012).

Cada endpoint DEBE declarar ``Depends(require(Op.X))``. El middleware lee esa
declaración para autorizar ANTES de ejecutar el handler; la dependencia, a su
vez, falla cerrada si el middleware no ha dejado un contexto coherente.
"""
from __future__ import annotations

from collections.abc import Callable
from typing import Any

from fastapi import HTTPException, Request
from fastapi.routing import APIRoute

from apps.permissions.context import MSG_403, ContextoSesion

OPERATION_ATTR = "__mind_operation_code__"


def require(operation_code: str) -> Callable[[Request], ContextoSesion]:
    def _require(request: Request) -> ContextoSesion:
        contexto = getattr(request.state, "contexto_sesion", None)
        if not isinstance(contexto, ContextoSesion) or contexto.operation_code != operation_code:
            raise HTTPException(status_code=403, detail=MSG_403)
        return contexto

    setattr(_require, OPERATION_ATTR, operation_code)
    _require.__name__ = f"require_{operation_code}"
    _require.__qualname__ = _require.__name__
    return _require


def _collect_operations(dependant: Any, found: set[str]) -> None:
    for dep in getattr(dependant, "dependencies", None) or ():
        code = getattr(getattr(dep, "call", None), OPERATION_ATTR, None)
        if isinstance(code, str):
            found.add(code)
        _collect_operations(dep, found)


def declared_operation(route: Any) -> str | None:
    """Código de operación declarado por la ruta; None si no hay o es contradictorio."""
    if not isinstance(route, APIRoute):
        return None
    found: set[str] = set()
    _collect_operations(route.dependant, found)
    if len(found) != 1:
        return None
    return next(iter(found))
