"""Acceso a BD (Oracle vía oracledb) con engine y sesiones creados de forma perezosa."""
from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime, timezone
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from config.settings import get_settings


@lru_cache
def get_engine() -> Engine:
    settings = get_settings()
    return create_engine(
        settings.database_url,
        echo=settings.database_echo,
        pool_pre_ping=True,
    )


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), expire_on_commit=False)


def SessionLocal() -> Session:
    """Abre una sesión nueva con la factoría perezosa."""
    return get_session_factory()()


@contextmanager
def uow(db: Session) -> Iterator[Session]:
    """Unidad de trabajo: un único commit si todo va bien; rollback y re-raise si falla."""
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise


def utc_now() -> datetime:
    """Instante actual en UTC, naive (tipo canónico del proyecto)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
