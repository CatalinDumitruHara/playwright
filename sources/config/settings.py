import os
from dataclasses import dataclass, field
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    database_url: str = field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL",
            "oracle+oracledb://mind:mind@localhost:1521/?service_name=FREEPDB1",
        )
    )
    password_min_length: int = field(
        default_factory=lambda: int(os.getenv("PASSWORD_MIN_LENGTH", "12"))
    )
    password_history_size: int = field(
        default_factory=lambda: int(os.getenv("PASSWORD_HISTORY_SIZE", "3"))
    )
    log_level: str = field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))


@lru_cache
def get_settings() -> Settings:
    return Settings()
