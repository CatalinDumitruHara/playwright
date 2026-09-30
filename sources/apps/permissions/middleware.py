"""Middleware ASGI de autorización deny-by-default (ARC-012).

Resuelve la ruta, obtiene la operación declarada y consulta PermisoRuleService
antes de ejecutar cualquier handler. Identidad y rol nunca salen de query ni body.
"""
from __future__ import annotations

from collections.abc import Callable
from typing import Any

import structlog
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool
from starlette.requests import HTTPConnection
from starlette.responses import JSONResponse
from starlette.routing import Match
from starlette.types import ASGIApp, Receive, Scope, Send

from apps.permissions.context import MSG_401, MSG_403, MSG_503, Outcome
from apps.permissions.dependencies import declared_operation
from apps.permissions.service import PermisoRuleService, build_default_service
from config.settings import Settings, get_settings

ServiceFactory = Callable[[], tuple[PermisoRuleService, Session | None]]

log = structlog.get_logger("permissions")


class AuthorizationMiddleware:
    def __init__(
        self,
        app: ASGIApp,
        *,
        service_factory: ServiceFactory | None = None,
        settings: Settings | None = None,
    ) -> None:
        self.app = app
        self.service_factory = service_factory or build_default_service
        self.settings = settings or get_settings()

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "websocket":
            await send({"type": "websocket.close", "code": 1008})
            return
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        method = scope.get("method", "").upper()
        if method == "OPTIONS":
            await self.app(scope, receive, send)
            return

        route = self._match_route(scope)
        if route is not None and self._is_public(method, route):
            await self.app(scope, receive, send)
            return

        conn = HTTPConnection(scope)
        token = self._extract_token(conn)
        operation_code = declared_operation(route) if route is not None else None
        path = scope.get("path", "")
        ip = conn.client.host if conn.client else None
        user_agent = conn.headers.get("user-agent")

        try:
            decision = await run_in_threadpool(
                self._authorize, token, operation_code, path, ip, user_agent
            )
        except Exception as exc:
            log.error("authorization_unavailable", error_type=type(exc).__name__)
            await JSONResponse({"detail": MSG_503}, status_code=503)(scope, receive, send)
            return

        if decision.outcome is Outcome.OK and decision.contexto is not None:
            scope.setdefault("state", {})["contexto_sesion"] = decision.contexto
            await self.app(scope, receive, send)
            return
        if decision.outcome is Outcome.DENIED_401:
            response = JSONResponse(
                {"detail": MSG_401},
                status_code=401,
                headers={"WWW-Authenticate": "Bearer"},
            )
        else:
            response = JSONResponse({"detail": MSG_403}, status_code=403)
        await response(scope, receive, send)

    # ------------------------------------------------------------------ #

    def _authorize(
        self,
        token: str | None,
        operation_code: str | None,
        path: str,
        ip: str | None,
        user_agent: str | None,
    ):
        service, db = self.service_factory()
        try:
            return service.authorize(
                token,
                operation_code,
                request_path=path,
                ip_address=ip,
                user_agent=user_agent,
            )
        finally:
            if db is not None:
                db.close()

    @staticmethod
    def _match_route(scope: Scope) -> Any | None:
        app = scope.get("app")
        router = getattr(app, "router", None)
        for route in getattr(router, "routes", None) or ():
            match, _child = route.matches(scope)
            if match == Match.FULL:
                return route
        return None

    def _is_public(self, method: str, route: Any) -> bool:
        path_format = getattr(route, "path_format", None)
        if not isinstance(path_format, str):
            return False
        base = self.settings.api_base_path.rstrip("/")
        if base:
            if not path_format.startswith(base + "/"):
                return False
            path_format = path_format[len(base):]
        return (method, path_format) in set(self.settings.public_operations)

    def _extract_token(self, conn: HTTPConnection) -> str | None:
        token = conn.cookies.get(self.settings.session_cookie_name)
        if token:
            return token
        auth = conn.headers.get("authorization")
        if auth:
            scheme, _, value = auth.partition(" ")
            if scheme.lower() == "bearer" and value.strip():
                return value.strip()
        return None
