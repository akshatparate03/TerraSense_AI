import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load backend/.env into the process environment. Without this call, a .env
# file sitting on disk is never actually read -- os.getenv() only sees real
# OS environment variables. This was the root cause of OTP/Google-login
# "not configured" errors even when .env had real values filled in.
load_dotenv(BASE_DIR / ".env")


def _split_csv(val: str) -> list[str]:
    return [v.strip() for v in val.split(",") if v.strip()]


class Settings:
    APP_NAME: str = "TerraSense AI"
    APP_TAGLINE: str = "Sense the Earth. Predict the Risk."

    HOST: str = os.getenv("APP_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("APP_PORT", os.getenv("PORT", "8000")))

    # Netlify frontend + Render backend are the default allowed origins; local dev
    # ports are included automatically. Override with CORS_ORIGINS env var
    # (comma-separated) in production if needed.
    CORS_ORIGINS: list[str] = _split_csv(
        os.getenv(
            "CORS_ORIGINS",
            "https://terrasenseai.netlify.app,http://localhost:5173,http://127.0.0.1:5173",
        )
    )
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://terrasenseai.netlify.app")

    # ------------------------------------------------------------------
    # Database (PostgreSQL - required)
    # ------------------------------------------------------------------
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/terrasense"
    )

    # ------------------------------------------------------------------
    # ML artifacts
    # ------------------------------------------------------------------
    MODEL_PATH: Path = Path(os.getenv("MODEL_PATH", BASE_DIR / "models" / "landslide_pipeline.joblib"))
    MODEL_METADATA_PATH: Path = Path(
        os.getenv("MODEL_METADATA_PATH", BASE_DIR / "models" / "model_metadata.json")
    )
    ARTIFACTS_DIR: Path = Path(os.getenv("ARTIFACTS_DIR", BASE_DIR / "artifacts"))
    DATASET_PATH: Path = Path(
        os.getenv("DATASET_PATH", BASE_DIR / "data" / "global_landslide_catalog.csv")
    )

    RISK_THRESHOLD_MEDIUM: float = float(os.getenv("RISK_THRESHOLD_MEDIUM", "0.35"))
    RISK_THRESHOLD_HIGH: float = float(os.getenv("RISK_THRESHOLD_HIGH", "0.65"))

    # ------------------------------------------------------------------
    # Auth
    # ------------------------------------------------------------------
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-only-change-me-in-production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # 7 days
    OTP_EXPIRE_MINUTES: int = int(os.getenv("OTP_EXPIRE_MINUTES", "10"))
    PASSWORD_RESET_EXPIRE_MINUTES: int = int(os.getenv("PASSWORD_RESET_EXPIRE_MINUTES", "30"))

    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")

    # Google Apps Script Web App URL used to actually send OTP / reset emails.
    # See README "Email via Google Apps Script" section for setup instructions.
    APPS_SCRIPT_EMAIL_URL: str = os.getenv("APPS_SCRIPT_EMAIL_URL", "")
    APPS_SCRIPT_SHARED_SECRET: str = os.getenv("APPS_SCRIPT_SHARED_SECRET", "")

    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")


settings = Settings()