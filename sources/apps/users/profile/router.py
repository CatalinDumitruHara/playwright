from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from apps.users.profile.auth import (
    ContextoSesion,
    get_password_profile_repository,
    require_authenticated_session,
)
from apps.users.profile.passwords import PasswordHasherPort
from apps.users.profile.repository import PasswordProfileRepository
from apps.users.profile.schemas import ErrorResponse, PasswordChangeRequest, PasswordChangeResult
from apps.users.profile.service import PasswordChangeError, PasswordChangeService
from config.database import get_db
from config.settings import get_settings

router = APIRouter(tags=["ARC-012"])


def get_password_hasher() -> PasswordHasherPort:
    return PasswordHasherPort()


def get_password_change_service(
    db: Annotated[Session, Depends(get_db)],
    repo: Annotated[PasswordProfileRepository, Depends(get_password_profile_repository)],
    hasher: Annotated[PasswordHasherPort, Depends(get_password_hasher)],
) -> PasswordChangeService:
    return PasswordChangeService(db, repo, hasher, get_settings())


@router.put(
    "/auth/password",
    response_model=PasswordChangeResult,
    status_code=200,
    operation_id="EP-005",
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
    },
)
def change_own_password(
    body: PasswordChangeRequest,
    request: Request,
    actor: Annotated[ContextoSesion, Depends(require_authenticated_session)],
    svc: Annotated[PasswordChangeService, Depends(get_password_change_service)],
) -> PasswordChangeResult:
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    try:
        return svc.change_password(body, actor, ip_address=ip_address, user_agent=user_agent)
    except PasswordChangeError as exc:
        return JSONResponse(status_code=exc.status_code, content={"code": exc.code, "message": exc.message})
