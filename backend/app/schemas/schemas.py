from typing import Optional

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    rainfall_mm: float = Field(..., ge=0, le=1000, description="Simulated/estimated rainfall in mm")
    soil_moisture_pct: float = Field(..., ge=0, le=100)
    temperature_c: float = Field(..., ge=-30, le=60)
    humidity_pct: float = Field(..., ge=0, le=100)
    slope_deg: float = Field(..., ge=0, le=90)
    elevation_m: float = Field(..., ge=0, le=9000)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    month: Optional[int] = Field(default=None, ge=1, le=12)
    trigger_hint: Optional[str] = Field(default="rain", description="'rain' | 'seismic' | 'other'")
    location_accuracy_km: Optional[float] = Field(default=1.0, ge=0, le=200)

    # Optional site details. The Predict page's "I have these values" flow sends
    # the ones the automatic data fetch could not retrieve (soil texture,
    # nearby buildings, construction sites). All optional, so older callers
    # keep working unchanged.
    radius_km: Optional[float] = Field(default=None, ge=0.5, le=25)
    soil_texture_class: Optional[str] = Field(default=None, description="'sandy' | 'silty' | 'clay-rich' | 'loam'")
    sand_pct: Optional[float] = Field(default=None, ge=0, le=100)
    silt_pct: Optional[float] = Field(default=None, ge=0, le=100)
    clay_pct: Optional[float] = Field(default=None, ge=0, le=100)
    soil_ph: Optional[float] = Field(default=None, ge=0, le=14)
    aspect_deg: Optional[float] = Field(default=None, ge=0, le=360)
    building_count: Optional[int] = Field(default=None, ge=0, le=10_000_000)
    construction_site_count: Optional[int] = Field(default=None, ge=0, le=100_000)


class MonitoringSubscribeRequest(BaseModel):
    """Body for POST /api/monitoring/start (spec sections 37-39)."""

    subscription_id: Optional[int] = Field(default=None, description="Provide to update an existing subscription instead of creating a new one")
    label: str = Field(default="My Location", max_length=200)
    email: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(default=5, ge=0.5, le=25)
    alert_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    reset_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    cooldown_minutes: Optional[int] = Field(default=None, ge=15, le=1440)


class MonitoringStopRequest(BaseModel):
    subscription_id: int


class LocationPredictionRequest(BaseModel):
    """Replaces manual environmental entry: the user only supplies a point
    and an analysis radius; the backend retrieves everything else live."""

    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(default=5, ge=0.5, le=25)
    location_label: Optional[str] = Field(default=None, description="Optional human-readable label, e.g. from map reverse-geocoding")
    trigger_hint: Optional[str] = Field(default="rain", description="'rain' | 'seismic' | 'other'")


class RiskDriver(BaseModel):
    feature: str
    importance: float
    value: float


class PredictionResponse(BaseModel):
    landslide_probability: float
    prediction_confidence: float
    risk_level: str
    model: str
    timestamp: str
    features: dict
    risk_drivers: list[RiskDriver]
    data_provenance: dict


class AlertItem(BaseModel):
    id: str
    severity: str
    timestamp: str
    location: str
    latitude: float
    longitude: float
    probability: float
    main_drivers: list[str]
    recommended_action: str
    note: str = "Automated risk alert - not a certified emergency warning."


class SimulationControlResponse(BaseModel):
    status: str
    is_running: bool
    is_paused: bool
    speed: float
    current_index: int
    total_records: int