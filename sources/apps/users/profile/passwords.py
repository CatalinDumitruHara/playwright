from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

ALGORITHM = "argon2id"


class PasswordHasherPort:
    """Hash y verificación de contraseñas con argon2id (la sal va embebida en el hash)."""

    def __init__(self) -> None:
        self._hasher = PasswordHasher()

    def hash(self, plain: str) -> str:
        return self._hasher.hash(plain)

    def verify(self, hashed: str, plain: str) -> bool:
        try:
            return self._hasher.verify(hashed, plain)
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            return False
