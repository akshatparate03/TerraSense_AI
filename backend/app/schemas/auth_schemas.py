from pydantic import BaseModel, EmailStr, Field


class RegisterStartRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class ResendOtpRequest(BaseModel):
    email: EmailStr


class SetPasswordRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    id_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    email: EmailStr
    new_password: str
    confirm_password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    auth_provider: str
    is_email_verified: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
