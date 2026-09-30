from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PasswordChangeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=1)
    new_password_confirmation: str = Field(min_length=1)


class PasswordChangeResult(BaseModel):
    password_updated_at: datetime
    revoked_sessions: int
    must_change_password: bool


class ErrorResponse(BaseModel):
    code: str
    message: str
