import base64
import binascii
import hashlib
import hmac
import json
import secrets
from pathlib import Path

TEACHERS_FILE = Path(__file__).with_name("teachers.json")
PASSWORD_ITERATIONS = 600_000


def create_password_hash(password: str) -> tuple[str, str]:
    salt = secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS
    )
    return base64.b64encode(salt).decode("ascii"), password_hash.hex()


def verify_password(password: str, salt: str, password_hash: str) -> bool:
    try:
        salt_bytes = base64.b64decode(salt, validate=True)
        expected_hash = bytes.fromhex(password_hash)
    except (ValueError, binascii.Error):
        return False

    actual_hash = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt_bytes, PASSWORD_ITERATIONS
    )
    return hmac.compare_digest(actual_hash, expected_hash)


def load_teachers() -> list[dict[str, str]]:
    teachers = json.loads(TEACHERS_FILE.read_text(encoding="utf-8"))
    if not isinstance(teachers, list):
        raise ValueError(f"{TEACHERS_FILE} must contain a JSON array")

    for teacher in teachers:
        if not isinstance(teacher, dict) or not all(
            isinstance(teacher.get(field), str)
            for field in ("username", "salt", "password_hash")
        ):
            raise ValueError(
                f"Each entry in {TEACHERS_FILE} must have "
                "string username, salt, and password_hash fields"
            )

    return teachers
