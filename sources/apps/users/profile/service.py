from sqlalchemy.orm import Session

from apps.users.profile.auth import ContextoSesion
from apps.users.profile.passwords import ALGORITHM, PasswordHasherPort
from apps.users.profile.repository import PasswordProfileRepository
from apps.users.profile.schemas import PasswordChangeRequest, PasswordChangeResult
from config.database import uow, utc_now
from config.logging import get_logger
from config.settings import Settings

logger = get_logger(__name__)

EVENT_PASSWORD_CHANGED = "PASSWORD_CHANGED"
OPERATION_PASSWORD_CHANGE = "PUT /auth/password"
OPERATION_CODE = "PASSWORD_CHANGE"


class PasswordChangeError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message

    @classmethod
    def confirmation_mismatch(cls) -> "PasswordChangeError":
        return cls(422, "PASSWORD_CONFIRMATION_MISMATCH", "La confirmación no coincide con la nueva contraseña")

    @classmethod
    def policy_violation(cls, min_length: int) -> "PasswordChangeError":
        return cls(
            422,
            "PASSWORD_POLICY_VIOLATION",
            f"La nueva contraseña debe tener al menos {min_length} caracteres",
        )

    @classmethod
    def unauthenticated(cls) -> "PasswordChangeError":
        return cls(401, "UNAUTHENTICATED", "Sesión no válida o caducada")

    @classmethod
    def current_password_invalid(cls) -> "PasswordChangeError":
        return cls(400, "CURRENT_PASSWORD_INVALID", "La contraseña actual no es correcta")

    @classmethod
    def reused(cls) -> "PasswordChangeError":
        return cls(
            422,
            "PASSWORD_REUSED",
            "La nueva contraseña no puede coincidir con la actual ni con las últimas utilizadas",
        )


class PasswordChangeService:
    def __init__(
        self,
        db: Session,
        repo: PasswordProfileRepository,
        hasher: PasswordHasherPort,
        settings: Settings,
    ) -> None:
        self.db = db
        self.repo = repo
        self.hasher = hasher
        self.settings = settings

    def change_password(
        self,
        cmd: PasswordChangeRequest,
        actor: ContextoSesion,
        *,
        ip_address: str | None,
        user_agent: str | None,
    ) -> PasswordChangeResult:
        try:
            now, revoked = self._change(cmd, actor, ip_address=ip_address, user_agent=user_agent)
        except PasswordChangeError as exc:
            logger.warning(
                "password_change_rejected",
                session_user_id=actor.user_id,
                code=exc.code,
                outcome="REJECTED",
            )
            raise

        logger.info(
            "password_changed",
            session_user_id=actor.user_id,
            role_code=actor.role_code,
            operation_code=OPERATION_CODE,
            outcome="OK",
            revoked_sessions=revoked,
        )
        return PasswordChangeResult(password_updated_at=now, revoked_sessions=revoked, must_change_password=False)

    def _change(
        self,
        cmd: PasswordChangeRequest,
        actor: ContextoSesion,
        *,
        ip_address: str | None,
        user_agent: str | None,
    ):
        if cmd.new_password != cmd.new_password_confirmation:
            raise PasswordChangeError.confirmation_mismatch()
        min_length = self.settings.password_min_length
        if len(cmd.new_password) < min_length:
            raise PasswordChangeError.policy_violation(min_length)

        with uow(self.db):
            user = self.repo.get_user_for_update(actor.user_id)
            if user is None:
                raise PasswordChangeError.unauthenticated()

            if not self.hasher.verify(user.password_hash, cmd.current_password):
                raise PasswordChangeError.current_password_invalid()

            history_size = self.settings.password_history_size
            if self.hasher.verify(user.password_hash, cmd.new_password) or any(
                self.hasher.verify(old_hash, cmd.new_password)
                for old_hash in self.repo.list_password_history_hashes(user.user_id, history_size)
            ):
                raise PasswordChangeError.reused()

            now = utc_now()
            self.repo.add_password_history(user.user_id, user.password_hash, now)
            self.repo.prune_password_history(user.user_id, history_size)
            self.repo.update_password(user, self.hasher.hash(cmd.new_password), ALGORITHM, now)
            revoked = self.repo.revoke_other_sessions(user.user_id, actor.session_id, now)
            self.repo.add_access_audit(
                user_id=user.user_id,
                session_id=actor.session_id,
                event_type=EVENT_PASSWORD_CHANGED,
                operation=OPERATION_PASSWORD_CHANGE,
                outcome="OK",
                at=now,
                ip_address=ip_address,
                user_agent=user_agent,
            )
        return now, revoked
