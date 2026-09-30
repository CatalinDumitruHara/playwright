"""Configuración del backend MIND (pydantic-settings v2, prefijo MIND_)."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="MIND_", extra="ignore")

    database_url: str = "oracle+oracledb://mind:mind@localhost:1521/?service_name=FREEPDB1"
    database_echo: bool = False
    # servers[0].url de openapi.yaml
    api_base_path: str = "/api"
    session_cookie_name: str = "MIND_SESSION"
    # (método, path del contrato SIN base). EP-001 es el único endpoint público.
    public_operations: tuple[tuple[str, str], ...] = (("POST", "/auth/sessions"),)
    log_level: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()
