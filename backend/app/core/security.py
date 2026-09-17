from __future__ import annotations

import re
import secrets
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---------------------------------------------------------------------------
# Password policy: 7 widely-used rules
# ---------------------------------------------------------------------------
PASSWORD_RULES = [
    ("At least 8 characters long", lambda p: len(p) >= 8),
    ("At least one uppercase letter (A-Z)", lambda p: any(c.isupper() for c in p)),
    ("At least one lowercase letter (a-z)", lambda p: any(c.islower() for c in p)),
    ("At least one digit (0-9)", lambda p: any(c.isdigit() for c in p)),
    ("At least one special character (!@#$%^&*...)", lambda p: bool(re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]", p))),
    ("No spaces allowed", lambda p: " " not in p),
    ("Maximum 64 characters", lambda p: len(p) <= 64),
]


def validate_password(password: str) -> list[str]:
    """Return a list of failed rule descriptions. Empty list = valid password."""
    return [desc for desc, check in PASSWORD_RULES if not check(password)]


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def hash_token(token: str) -> str:
    """Hash OTPs / reset tokens the same way as passwords before storing them."""
    return pwd_context.hash(token)


def verify_token_hash(token: str, token_hash: str) -> bool:
    return pwd_context.verify(token, token_hash)


def generate_otp() -> str:
    return f"{secrets.randbelow(1000000):06d}"


def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)


def create_access_token(subject: str, extra_claims: dict | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire, "iat": datetime.now(timezone.utc)}
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
