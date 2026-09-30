from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from apps.users.profile.repository import PasswordProfileRepository
from config.database import get_db, utc_now

USER_STATUS_ACTIVE = "ACTIVO"

_UNAUTHENTICATED_DETAIL = {"code": "UNAUTHENTICATED", "message": "Sesión no válida o caducada"}
_FORBIDDEN_DETAIL = {"code": "FORBIDDEN", "message": "Operación no permitida para el rol vigente"}


@dataclass(frozen=True)
class ContextoSesion:
    user_id: int
    role_code: str
    session_id: str


def get_password_profile_repository(db: Annotated[Session, Depends(get_db)]) -> PasswordProfileRepository:
    return PasswordProfileRepository(db)


bearer = HTTPBearer(auto_error=False)


def _unauthenticated() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=_UNAUTHENTICATED_DETAIL,
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_authenticated_session(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    repo: Annotated[PasswordProfileRepository, Depends(get_password_profile_repository)],
) -> ContextoSesion:
    if credentials is None or not credentials.credentials:
        raise _unauthenticated()

    session = repo.get_active_session(credentials.credentials, utc_now())
    if session is None:
        raise _unauthenticated()

    user = repo.get_user(session.user_id)
    if user is None or user.status != USER_STATUS_ACTIVE:
        raise _unauthenticated()

    # El rol se relee del usuario en cada petición, no del snapshot de la sesión.
    if not repo.is_role_active(user.role_code):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=_FORBIDDEN_DETAIL)

    return ContextoSesion(user_id=user.user_id, role_code=user.role_code, session_id=session.session_id)
