from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class AlertStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class PredictionSource(str, enum.Enum):
    MANUAL = "manual"
    SIMULATION = "simulation"


# ---------------------------------------------------------------------------
# Locations
# ---------------------------------------------------------------------------
class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    region: Mapped[str | None] = mapped_column(String(200))
    country: Mapped[str | None] = mapped_column(String(120))
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    elevation: Mapped[float | None] = mapped_column(Float)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    environmental_readings: Mapped[list["EnvironmentalReading"]] = relationship(
        back_populates="location", cascade="all, delete-orphan"
    )
    predictions: Mapped[list["Prediction"]] = relationship(back_populates="location")
    landslide_events: Mapped[list["LandslideEvent"]] = relationship(back_populates="location")

    __table_args__ = (Index("ix_locations_name", "name"),)


# ---------------------------------------------------------------------------
# Environmental readings
# ---------------------------------------------------------------------------
class EnvironmentalReading(Base):
    __tablename__ = "environmental_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    rainfall: Mapped[float | None] = mapped_column(Float)
    temperature: Mapped[float | None] = mapped_column(Float)
    humidity: Mapped[float | None] = mapped_column(Float)
    soil_moisture: Mapped[float | None] = mapped_column(Float)
    slope: Mapped[float | None] = mapped_column(Float)
    elevation: Mapped[float | None] = mapped_column(Float)

    # "real" | "simulated_demo" -- see backend/app/ml/data_pipeline.py docstring for
    # why simulated environmental values are needed and how they're documented.
    source: Mapped[str] = mapped_column(String(30), default="simulated_demo")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    location: Mapped["Location"] = relationship(back_populates="environmental_readings")
    predictions: Mapped[list["Prediction"]] = relationship(back_populates="environmental_reading")

    __table_args__ = (
        Index("ix_env_readings_location_id", "location_id"),
        Index("ix_env_readings_timestamp", "timestamp"),
    )


# ---------------------------------------------------------------------------
# Model runs (model/version tracking)
# ---------------------------------------------------------------------------
class ModelRun(Base):
    __tablename__ = "model_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    model_name: Mapped[str] = mapped_column(String(120), nullable=False)
    model_type: Mapped[str] = mapped_column(String(60), nullable=False)
    model_version: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    training_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    dataset_name: Mapped[str] = mapped_column(String(200))
    dataset_version: Mapped[str] = mapped_column(String(120))
    training_samples: Mapped[int | None] = mapped_column(Integer)
    testing_samples: Mapped[int | None] = mapped_column(Integer)

    accuracy: Mapped[float | None] = mapped_column(Float)
    precision: Mapped[float | None] = mapped_column(Float)
    recall: Mapped[float | None] = mapped_column(Float)
    f1_score: Mapped[float | None] = mapped_column(Float)
    roc_auc: Mapped[float | None] = mapped_column(Float)

    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    artifact_path: Mapped[str | None] = mapped_column(String(400))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    predictions: Mapped[list["Prediction"]] = relationship(back_populates="model_run")

    __table_args__ = (Index("ix_model_runs_version", "model_version"),)


# ---------------------------------------------------------------------------
# Predictions
# ---------------------------------------------------------------------------
class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id", ondelete="SET NULL"))
    environmental_reading_id: Mapped[int | None] = mapped_column(
        ForeignKey("environmental_readings.id", ondelete="SET NULL")
    )
    model_run_id: Mapped[int | None] = mapped_column(ForeignKey("model_runs.id", ondelete="SET NULL"))
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    predicted_class: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 = landslide, 0 = no landslide
    risk_level: Mapped[str] = mapped_column(String(10), nullable=False)
    risk_probability: Mapped[float] = mapped_column(Float, nullable=False)
    model_version: Mapped[str] = mapped_column(String(40), nullable=False)
    prediction_source: Mapped[str] = mapped_column(String(20), default=PredictionSource.MANUAL.value)
    input_features: Mapped[str | None] = mapped_column(Text)  # JSON snapshot of inputs, for audit trail
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    location: Mapped["Location"] = relationship(back_populates="predictions")
    environmental_reading: Mapped["EnvironmentalReading"] = relationship(back_populates="predictions")
    model_run: Mapped["ModelRun"] = relationship(back_populates="predictions")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="prediction", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_predictions_location_id", "location_id"),
        Index("ix_predictions_timestamp", "timestamp"),
        Index("ix_predictions_risk_level", "risk_level"),
        Index("ix_predictions_model_version", "model_version"),
    )


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------
class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    prediction_id: Mapped[int] = mapped_column(ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False)
    location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id", ondelete="SET NULL"))

    alert_level: Mapped[str] = mapped_column(String(20), nullable=False)  # HIGH | WARNING | INFORMATIONAL
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    status: Mapped[str] = mapped_column(String(20), default=AlertStatus.ACTIVE.value)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    prediction: Mapped["Prediction"] = relationship(back_populates="alerts")
    location: Mapped["Location"] = relationship()

    __table_args__ = (
        Index("ix_alerts_status", "status"),
        Index("ix_alerts_location_id", "location_id"),
    )


# ---------------------------------------------------------------------------
# Historical landslide events (real, from Global Landslide Catalog)
# ---------------------------------------------------------------------------
class LandslideEvent(Base):
    __tablename__ = "landslide_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id", ondelete="SET NULL"))
    event_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    severity: Mapped[str | None] = mapped_column(String(60))  # landslide_size from GLC, where available
    category: Mapped[str | None] = mapped_column(String(80))
    trigger: Mapped[str | None] = mapped_column(String(80))
    country: Mapped[str | None] = mapped_column(String(120))
    title: Mapped[str | None] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text)
    fatality_count: Mapped[float | None] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(120), default="NASA Global Landslide Catalog")
    dataset_reference: Mapped[str | None] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    location: Mapped["Location"] = relationship(back_populates="landslide_events")

    __table_args__ = (
        Index("ix_landslide_events_event_date", "event_date"),
        Index("ix_landslide_events_location_id", "location_id"),
    )


# ---------------------------------------------------------------------------
# Users / Auth
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uuid: Mapped[str] = mapped_column(String(36), default=lambda: str(uuid.uuid4()), unique=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    # 'individual' | 'organization' -- collected at registration, purely
    # informational (doesn't gate access to anything).
    account_type: Mapped[str] = mapped_column(String(20), default="individual")
    password_hash: Mapped[str | None] = mapped_column(String(255))  # null for Google-only accounts
    auth_provider: Mapped[str] = mapped_column(String(20), default="local")  # 'local' | 'google'
    google_sub: Mapped[str | None] = mapped_column(String(120), unique=True)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    __table_args__ = (Index("ix_users_email", "email"),)


class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    otp_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    purpose: Mapped[str] = mapped_column(String(30), default="register")  # 'register'
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (Index("ix_otp_email", "email"),)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (Index("ix_pw_reset_email", "email"),)


# ---------------------------------------------------------------------------
# Geospatial data engine cache (spec section 16 -- avoid re-hitting free
# public APIs -- Open-Meteo / SoilGrids / Overpass -- for the same location
# repeatedly; static-ish sources (elevation/slope/soil) are cached longer
# than dynamic ones (weather/rainfall) via `expires_at`)
# ---------------------------------------------------------------------------
class GeoFeatureCache(Base):
    __tablename__ = "geo_feature_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Rounded to GEO_CACHE_COORD_PRECISION decimal places -- see config.py
    latitude_rounded: Mapped[float] = mapped_column(Float, nullable=False)
    longitude_rounded: Mapped[float] = mapped_column(Float, nullable=False)
    radius_km: Mapped[float] = mapped_column(Float, nullable=False)
    # 'weather' | 'elevation_slope' | 'soil' | 'construction'
    source: Mapped[str] = mapped_column(String(30), nullable=False)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    data_status: Mapped[str] = mapped_column(String(20), default="LIVE")  # LIVE | UNAVAILABLE
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        Index("ix_geo_cache_lookup", "latitude_rounded", "longitude_rounded", "radius_km", "source"),
    )


# ---------------------------------------------------------------------------
# Email alert monitoring (spec sections 37-43) -- replaces the
# website-only Alert list above as the PRIMARY warning mechanism. A user
# subscribes a location+radius+threshold; a background worker
# (app/services/monitoring_service.py + APScheduler in main.py) periodically
# re-runs the live prediction pipeline for every active subscription and
# emails the user when risk crosses their threshold, with hysteresis to
# prevent alert spam (spec section 42).
# ---------------------------------------------------------------------------
class AlertSubscription(Base):
    __tablename__ = "alert_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    label: Mapped[str] = mapped_column(String(200), default="My Location")
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    radius_km: Mapped[float] = mapped_column(Float, default=5.0)

    alert_threshold: Mapped[float] = mapped_column(Float, default=0.65)  # crossing this triggers an email
    reset_threshold: Mapped[float] = mapped_column(Float, default=0.50)  # must fall below this before re-arming
    cooldown_minutes: Mapped[int] = mapped_column(Integer, default=360)  # minimum gap between emails

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)  # user-controlled monitoring on/off
    # Hysteresis state -- see app/services/monitoring_service.py
    alert_state: Mapped[str] = mapped_column(String(20), default="NORMAL")  # NORMAL | ALERTED

    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_probability: Mapped[float | None] = mapped_column(Float)
    last_alert_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped["User"] = relationship()
    email_alerts: Mapped[list["EmailAlertLog"]] = relationship(back_populates="subscription", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_alert_sub_user_active", "user_id", "is_active"),)


class EmailAlertLog(Base):
    """One row per email actually sent (or attempted) -- spec section 86
    'Alert History'."""

    __tablename__ = "email_alert_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subscription_id: Mapped[int] = mapped_column(ForeignKey("alert_subscriptions.id", ondelete="CASCADE"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    probability: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    threshold_at_send: Mapped[float] = mapped_column(Float, nullable=False)
    delivery_status: Mapped[str] = mapped_column(String(20), default="SENT")  # SENT | FAILED | DEV_MODE_LOGGED
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    subscription: Mapped["AlertSubscription"] = relationship(back_populates="email_alerts")

    __table_args__ = (Index("ix_email_alert_log_sub", "subscription_id"),)
