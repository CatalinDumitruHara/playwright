from fastapi import FastAPI

from config.logging import configure_logging
from config.urls import API_BASE_PATH, api_router

configure_logging()

app = FastAPI(title="Gestor de incidencias - API")
app.include_router(api_router, prefix=API_BASE_PATH)
