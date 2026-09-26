from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import PASSWORD_RULES
from app.models.db_models import User
from app.schemas.auth_schemas import (
    ForgotPasswordRequest,
    GoogleLoginRequest,
    LoginRequest,
    RegisterStartRequest,
    ResendOtpRequest,
    ResetPasswordRequest,
    SetPasswordRequest,
    TokenResponse,
    UserOut,
    VerifyOtpRequest,
)
from app.services import auth_service
from app.services.auth_service import AuthError

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _handle(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/password-rules")
async def password_rules():
    return {"rules": [desc for desc, _ in PASSWORD_RULES]}


@router.post("/register")
async def register(payload: RegisterStartRequest, db: Session = Depends(get_db)):
    return _handle(auth_service.start_registration, db, payload.name, payload.email, payload.account_type)


@router.post("/verify-otp")
async def verify_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    return _handle(auth_service.verify_otp, db, payload.email, payload.otp)


@router.post("/resend-otp")
async def resend_otp(payload: ResendOtpRequest, db: Session = Depends(get_db)):
    return _handle(auth_service.resend_otp, db, payload.email)


@router.post("/set-password", response_model=TokenResponse)
async def set_password(payload: SetPasswordRequest, db: Session = Depends(get_db)):
    result = _handle(
        auth_service.set_password, db, payload.email, payload.password, payload.confirm_password
    )
    return TokenResponse(access_token=result["access_token"], user=UserOut.model_validate(result["user"]))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    result = _handle(auth_service.login, db, payload.email, payload.password)
    return TokenResponse(access_token=result["access_token"], user=UserOut.model_validate(result["user"]))


@router.post("/google", response_model=TokenResponse)
async def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    result = _handle(auth_service.google_login, db, payload.id_token)
    return TokenResponse(access_token=result["access_token"], user=UserOut.model_validate(result["user"]))


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return _handle(auth_service.forgot_password, db, payload.email)


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    return _handle(
        auth_service.reset_password,
        db,
        payload.token,
        payload.email,
        payload.new_password,
        payload.confirm_password,
    )


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    # JWTs are stateless; "logout" is enforced client-side by discarding the
    # token. This endpoint exists for a consistent API surface / to confirm
    # the token was valid at logout time.
    return {"message": "Logged out successfully."}
