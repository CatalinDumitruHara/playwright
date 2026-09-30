import logging
import sys
from typing import Any

import structlog

from config.settings import get_settings

SENSITIVE_KEYS = frozenset(
    {
        "password",
        "current_password",
        "new_password",
        "new_password_confirmation",
        "temporary_password",
        "password_hash",
        "password_salt",
        "session_token",
        "cookie",
        "authorization",
        "corporate_email",
    }
)
MASK = "***"


def mask_sensitive(_logger: Any, _method: str, event_dict: dict[str, Any]) -> dict[str, Any]:
    for key in list(event_dict.keys()):
        if isinstance(key, str) and key.lower() in SENSITIVE_KEYS:
            event_dict[key] = MASK
    return event_dict


def configure_logging() -> None:
    level = logging.getLevelName(get_settings().log_level.upper())
    if not isinstance(level, int):
        level = logging.INFO
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=level)
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            mask_sensitive,
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)
