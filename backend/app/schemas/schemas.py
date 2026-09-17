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