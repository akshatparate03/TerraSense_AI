from __future__ import annotations

from datetime import datetime, timedelta, timezone

from google.oauth2 import id_token as google_id_token
from google.auth import exceptions as google_exceptions
from google.auth.transport import requests as google_requests
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_otp,
    generate_reset_token,
    hash_password,
    hash_token,
    validate_password,
    verify_password,
    verify_token_hash,
)
from app.models.db_models import OTPVerification, PasswordResetToken, User
from app.services.email_service import send_otp_email, send_password_reset_email


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def start_registration(db: Session, name: str, email: str) -> dict:
    email = email.lower().strip()
    user = db.query(User).filter(User.email == email).first()

    if user and user.is_email_verified and user.password_hash:
        raise AuthError(
            "This email is already registered. Please log in instead.", status_code=409
        )

    if user is None:
        user = User(name=name, email=email, auth_provider="local", is_email_verified=False)
        db.add(user)
    else:
        user.name = name  # allow correcting name on re-attempt before verification

    db.commit()
    db.refresh(user)

    otp = generate_otp()
    record = OTPVerification(
        email=email,
        otp_hash=hash_token(otp),
        purpose="register",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    )
    db.add(record)
    db.commit()

    delivered = send_otp_email(email, name, otp)
    if delivered:
        message = "OTP sent to your email."
    else:
        message = (
            "Email service is not configured on this server, so no real email was sent. "
            "Check the backend console/terminal logs for your OTP code (development mode)."
        )
    return {"message": message, "email": email, "expires_in_minutes": settings.OTP_EXPIRE_MINUTES, "email_delivered": delivered}


def verify_otp(db: Session, email: str, otp: str) -> dict:
    email = email.lower().strip()
    record = (
        db.query(OTPVerification)
        .filter(OTPVerification.email == email, OTPVerification.purpose == "register", OTPVerification.is_used.is_(False))
        .order_by(OTPVerification.created_at.desc())
        .first()
    )
    if not record:
        raise AuthError("No pending verification found for this email. Please register again.")

    if record.expires_at < datetime.now(timezone.utc):
        raise AuthError("This OTP has expired. Please request a new one.")

    if record.attempts >= 5:
        raise AuthError("Too many incorrect attempts. Please request a new OTP.")

    if not verify_token_hash(otp, record.otp_hash):
        record.attempts += 1
        db.commit()
        raise AuthError("Incorrect OTP. Please try again.")

    record.is_used = True
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise AuthError("User not found.", status_code=404)
    user.is_email_verified = True
    db.commit()
    return {"message": "Email verified successfully. Please set your password."}


def resend_otp(db: Session, email: str) -> dict:
    email = email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise AuthError("No registration found for this email.")
    if user.is_email_verified and user.password_hash:
        raise AuthError("This email is already registered. Please log in instead.", status_code=409)
    return start_registration(db, user.name, email)


def set_password(db: Session, email: str, password: str, confirm_password: str) -> dict:
    email = email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise AuthError("User not found.", status_code=404)
    if not user.is_email_verified:
        raise AuthError("Please verify your email with the OTP first.")
    if password != confirm_password:
        raise AuthError("Passwords do not match.")

    failed_rules = validate_password(password)
    if failed_rules:
        raise AuthError("Password does not meet requirements: " + "; ".join(failed_rules))

    user.password_hash = hash_password(password)
    user.auth_provider = "local"
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "user": user}


def login(db: Session, email: str, password: str) -> dict:
    email = email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.password_hash:
        raise AuthError("Invalid email or password.", status_code=401)
    if not user.is_active:
        raise AuthError("This account has been disabled.", status_code=403)
    if not user.is_email_verified:
        raise AuthError("Please verify your email before logging in.", status_code=403)
    if not verify_password(password, user.password_hash):
        raise AuthError("Invalid email or password.", status_code=401)

    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "user": user}


def google_login(db: Session, id_token_str: str) -> dict:
    if not settings.GOOGLE_CLIENT_ID:
        raise AuthError("Google Sign-In is not configured on this server.", status_code=503)
    try:
        # clock_skew_in_seconds tolerates small differences between this
        # server's system clock and Google's -- without it, a server clock
        # that is even a few seconds behind real time causes a hard
        # "Token used too early" failure on every single Google sign-in.
        payload = google_id_token.verify_oauth2_token(
            id_token_str, google_requests.Request(), settings.GOOGLE_CLIENT_ID, clock_skew_in_seconds=20
        )
    except ValueError as e:
        # Malformed/invalid/expired/wrong-audience tokens all surface as
        # ValueError from this library.
        raise AuthError(f"Invalid Google token: {e}", status_code=401)
    except google_exceptions.GoogleAuthError as e:
        # Network/transport failures (e.g. can't reach Google's certificate
        # endpoint) are not the user's fault -- don't 500, return a clear
        # retryable error instead.
        raise AuthError(f"Could not verify Google sign-in right now: {e}", status_code=503)

    email = payload.get("email", "").lower().strip()
    name = payload.get("name") or email.split("@")[0]
    google_sub = payload.get("sub")
    if not email or not payload.get("email_verified", False):
        raise AuthError("Google account email is not verified.", status_code=401)

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        # New user via Google -> registers automatically, exactly once, no OTP needed
        # since Google has already verified the email.
        user = User(
            name=name,
            email=email,
            auth_provider="google",
            google_sub=google_sub,
            is_email_verified=True,
        )
        db.add(user)
    else:
        if not user.google_sub:
            user.google_sub = google_sub
        user.is_email_verified = True
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "user": user}


def forgot_password(db: Session, email: str) -> dict:
    email = email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    generic_message = {
        "message": "If an account with that email exists, a password reset link has been sent."
    }
    if not user or user.auth_provider != "local" or not user.password_hash:
        # Do not reveal whether the account exists (standard security practice) -
        # still return the same generic response.
        return generic_message

    raw_token = generate_reset_token()
    record = PasswordResetToken(
        email=email,
        token_hash=hash_token(raw_token),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES),
    )
    db.add(record)
    db.commit()

    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}&email={email}"
    send_password_reset_email(email, user.name, reset_link)
    return generic_message


def reset_password(db: Session, token: str, email: str, new_password: str, confirm_password: str) -> dict:
    email = email.lower().strip()
    if new_password != confirm_password:
        raise AuthError("Passwords do not match.")
    failed_rules = validate_password(new_password)
    if failed_rules:
        raise AuthError("Password does not meet requirements: " + "; ".join(failed_rules))

    candidates = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.email == email, PasswordResetToken.is_used.is_(False))
        .order_by(PasswordResetToken.created_at.desc())
        .all()
    )
    matched = next((r for r in candidates if verify_token_hash(token, r.token_hash)), None)
    if not matched:
        raise AuthError("Invalid or already-used reset link.", status_code=400)
    if matched.expires_at < datetime.now(timezone.utc):
        raise AuthError("This reset link has expired. Please request a new one.", status_code=400)

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise AuthError("User not found.", status_code=404)

    user.password_hash = hash_password(new_password)
    matched.is_used = True
    db.commit()
    return {"message": "Password has been reset successfully. You can now log in."}