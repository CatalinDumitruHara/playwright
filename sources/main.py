from fastapi import FastAPI, Request
from fastapi.exception_handlers import http_exception_handler
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from config.logging import configure_logging
from config.urls import API_BASE_PATH, api_router

configure_logging()

app = FastAPI(title="Gestor de incidencias - API")


@app.exception_handler(StarletteHTTPException)
async def error_response_handler(request: Request, exc: StarletteHTTPException):
    """Devuelve los errores con cuerpo {code, message} (ErrorResponse) tal cual, sin envolver en `detail`."""
    if isinstance(exc.detail, dict) and {"code", "message"} <= exc.detail.keys():
        return JSONResponse(status_code=exc.status_code, content=exc.detail, headers=exc.headers)
    return await http_exception_handler(request, exc)


app.include_router(api_router, prefix=API_BASE_PATH)
