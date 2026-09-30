"""Composition root del backend MIND (FastAPI)."""
from __future__ import annotations

import os
from collections.abc import Sequence

import structlog
from fastapi import APIRouter, FastAPI

from apps.permissions.middleware import AuthorizationMiddleware, ServiceFactory
from config.settings import Settings, get_settings

_logging_configured = False


def _configure_logging() -> None:
    global _logging_configured
    if _logging_configured:
        return
    structlog.configure(
        processors=[
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.JSONRenderer(),
        ]
    )
    _logging_configured = True


def create_app(
    *,
    routers: Sequence[APIRouter] = (),
    service_factory: ServiceFactory | None = None,
    settings: Settings | None = None,
) -> FastAPI:
    settings = settings or get_settings()
    _configure_logging()
    app = FastAPI(
        title="Gestor incidencias fan-out — API",
        version="0.1.0",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    # URL pública = api_base_path (servers[0].url) + path del contrato.
    for router in routers:
        app.include_router(router, prefix=settings.api_base_path)
    app.add_middleware(
        AuthorizationMiddleware, service_factory=service_factory, settings=settings
    )
    return app


# Los routers de funcionalidad (otras TSK) se registran en esta tupla.
# Cada endpoint DEBE declarar Depends(require(Op.X)); sin declaración ⇒ 403.
app = create_app(routers=())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("MIND_HOST", "0.0.0.0"),
        port=int(os.getenv("MIND_PORT", "8000")),
    )
