from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.db_models import (
    Alert,
    EnvironmentalReading,
    LandslideEvent,
    Location,
    ModelRun,
    Prediction,
)

ALERT_MESSAGES = {
    "HIGH": "Landslide probability exceeded the HIGH risk threshold. Avoid steep-slope areas and notify local authorities.",
    "WARNING": "Landslide probability crossed the MEDIUM risk threshold. Monitor conditions closely.",
}


# ---------------------------------------------------------------------------
# Locations
# ---------------------------------------------------------------------------
def list_locations(db: Session, active_only: bool = True) -> list[Location]:
    q = db.query(Location)
    if active_only:
        q = q.filter(Location.is_active.is_(True))
    return q.order_by(Location.name).all()


def get_location(db: Session, location_id: int) -> Location | None:
    return db.query(Location).filter(Location.id == location_id).first()


def create_location(db: Session, data: dict) -> Location:
    loc = Location(**data)
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


def update_location(db: Session, location_id: int, data: dict) -> Location | None:
    loc = get_location(db, location_id)
    if not loc:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(loc, k, v)
    db.commit()
    db.refresh(loc)
    return loc


def delete_location(db: Session, location_id: int) -> bool:
    """Soft-delete: locations with historical predictions/events must not be
    hard-deleted (would break the audit trail / foreign keys)."""
    loc = get_location(db, location_id)
    if not loc:
        return False
    has_history = (
        db.query(Prediction).filter(Prediction.location_id == location_id).first() is not None
        or db.query(LandslideEvent).filter(LandslideEvent.location_id == location_id).first() is not None
    )
    if has_history:
        loc.is_active = False
        db.commit()
    else:
        db.delete(loc)
        db.commit()
    return True


def get_or_create_location_by_coords(db: Session, name: str, lat: float, lon: float, country: str | None = None) -> Location:
    existing = (
        db.query(Location)
        .filter(func.abs(Location.latitude - lat) < 0.001, func.abs(Location.longitude - lon) < 0.001)
        .first()
    )
    if existing:
        return existing
    loc = Location(name=name[:200], latitude=lat, longitude=lon, country=country)
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


# ---------------------------------------------------------------------------
# Environmental readings
# ---------------------------------------------------------------------------
def record_environmental_reading(db: Session, location_id: int, features: dict, source: str) -> EnvironmentalReading:
    reading = EnvironmentalReading(
        location_id=location_id,
        rainfall=features.get("rainfall_mm"),
        temperature=features.get("temperature_c"),
        humidity=features.get("humidity_pct"),
        soil_moisture=features.get("soil_moisture_pct"),
        slope=features.get("slope_deg"),
        elevation=features.get("elevation_m"),
        source=source,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


# ---------------------------------------------------------------------------
# Predictions
# ---------------------------------------------------------------------------
def record_prediction(
    db: Session,
    location_id: int | None,
    environmental_reading_id: int | None,
    model_run_id: int | None,
    prediction_result: dict,
    source: str,
) -> Prediction:
    pred = Prediction(
        location_id=location_id,
        environmental_reading_id=environmental_reading_id,
        model_run_id=model_run_id,
        predicted_class=1 if prediction_result["risk_level"] != "LOW" else 0,
        risk_level=prediction_result["risk_level"],
        risk_probability=prediction_result["landslide_probability"],
        model_version=prediction_result.get("model", "unknown"),
        prediction_source=source,
        input_features=json.dumps(prediction_result.get("features", {})),
    )
    db.add(pred)
    db.commit()
    db.refresh(pred)
    return pred


def generate_alert_if_needed(db: Session, prediction: Prediction, location_name: str) -> Alert | None:
    if prediction.risk_level == "HIGH":
        level = "HIGH"
    elif prediction.risk_level == "MEDIUM":
        level = "WARNING"
    else:
        return None

    alert = Alert(
        prediction_id=prediction.id,
        location_id=prediction.location_id,
        alert_level=level,
        title=f"{level} risk detected near {location_name}",
        message=ALERT_MESSAGES[level] + f" Predicted risk probability: {prediction.risk_probability * 100:.1f}%.",
        status="ACTIVE",
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def list_predictions(
    db: Session,
    limit: int = 50,
    offset: int = 0,
    location_id: int | None = None,
    risk_level: str | None = None,
    model_version: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
):
    q = db.query(Prediction)
    if location_id:
        q = q.filter(Prediction.location_id == location_id)
    if risk_level:
        q = q.filter(Prediction.risk_level == risk_level.upper())
    if model_version:
        q = q.filter(Prediction.model_version == model_version)
    if date_from:
        q = q.filter(Prediction.timestamp >= date_from)
    if date_to:
        q = q.filter(Prediction.timestamp <= date_to)
    total = q.count()
    items = q.order_by(Prediction.timestamp.desc()).offset(offset).limit(limit).all()
    return total, items


def get_prediction(db: Session, prediction_id: int) -> Prediction | None:
    return db.query(Prediction).filter(Prediction.id == prediction_id).first()


def get_latest_predictions(db: Session, limit: int = 10):
    return db.query(Prediction).order_by(Prediction.timestamp.desc()).limit(limit).all()


def get_high_risk_predictions(db: Session, limit: int = 50):
    return (
        db.query(Prediction)
        .filter(Prediction.risk_level == "HIGH")
        .order_by(Prediction.timestamp.desc())
        .limit(limit)
        .all()
    )


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------
def list_alerts(db: Session, status: str | None = None, limit: int = 50, offset: int = 0):
    q = db.query(Alert)
    if status:
        q = q.filter(Alert.status == status.upper())
    total = q.count()
    items = q.order_by(Alert.triggered_at.desc()).offset(offset).limit(limit).all()
    return total, items


def get_alert(db: Session, alert_id: int) -> Alert | None:
    return db.query(Alert).filter(Alert.id == alert_id).first()


def update_alert_status(db: Session, alert_id: int, status: str) -> Alert | None:
    alert = get_alert(db, alert_id)
    if not alert:
        return None
    alert.status = status.upper()
    if status.upper() == "RESOLVED":
        alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return alert


# ---------------------------------------------------------------------------
# Landslide events
# ---------------------------------------------------------------------------
def list_landslide_events(
    db: Session,
    limit: int = 50,
    offset: int = 0,
    country: str | None = None,
    location_id: int | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
):
    q = db.query(LandslideEvent)
    if country:
        q = q.filter(LandslideEvent.country.ilike(f"%{country}%"))
    if location_id:
        q = q.filter(LandslideEvent.location_id == location_id)
    if date_from:
        q = q.filter(LandslideEvent.event_date >= date_from)
    if date_to:
        q = q.filter(LandslideEvent.event_date <= date_to)
    total = q.count()
    items = q.order_by(LandslideEvent.event_date.desc()).offset(offset).limit(limit).all()
    return total, items


def get_landslide_event(db: Session, event_id: int) -> LandslideEvent | None:
    return db.query(LandslideEvent).filter(LandslideEvent.id == event_id).first()


# ---------------------------------------------------------------------------
# Model runs
# ---------------------------------------------------------------------------
def list_model_runs(db: Session):
    return db.query(ModelRun).order_by(ModelRun.created_at.desc()).all()


def get_active_model_run(db: Session) -> ModelRun | None:
    return db.query(ModelRun).filter(ModelRun.is_active.is_(True)).order_by(ModelRun.created_at.desc()).first()


def get_model_run(db: Session, model_id: int) -> ModelRun | None:
    return db.query(ModelRun).filter(ModelRun.id == model_id).first()


# ---------------------------------------------------------------------------
# Analytics (all queried from PostgreSQL, nothing hardcoded)
# ---------------------------------------------------------------------------
def analytics_overview(db: Session) -> dict:
    total_predictions = db.query(func.count(Prediction.id)).scalar() or 0
    high_risk = db.query(func.count(Prediction.id)).filter(Prediction.risk_level == "HIGH").scalar() or 0
    medium_risk = db.query(func.count(Prediction.id)).filter(Prediction.risk_level == "MEDIUM").scalar() or 0
    low_risk = db.query(func.count(Prediction.id)).filter(Prediction.risk_level == "LOW").scalar() or 0
    active_alerts = db.query(func.count(Alert.id)).filter(Alert.status == "ACTIVE").scalar() or 0
    monitored_locations = db.query(func.count(Location.id)).filter(Location.is_active.is_(True)).scalar() or 0
    historical_events = db.query(func.count(LandslideEvent.id)).scalar() or 0
    active_model = get_active_model_run(db)

    return {
        "total_predictions": total_predictions,
        "high_risk_predictions": high_risk,
        "medium_risk_predictions": medium_risk,
        "low_risk_predictions": low_risk,
        "active_alerts": active_alerts,
        "monitored_locations": monitored_locations,
        "historical_events": historical_events,
        "active_model_name": active_model.model_name if active_model else None,
        "active_model_version": active_model.model_version if active_model else None,
        "active_model_accuracy": active_model.accuracy if active_model else None,
        "last_update": datetime.now(timezone.utc).isoformat(),
    }


def analytics_risk_distribution(db: Session) -> dict:
    rows = db.query(Prediction.risk_level, func.count(Prediction.id)).group_by(Prediction.risk_level).all()
    return {level: count for level, count in rows}


def analytics_location_summary(db: Session) -> list[dict]:
    rows = (
        db.query(
            Location.id,
            Location.name,
            Location.latitude,
            Location.longitude,
            func.count(Prediction.id).label("prediction_count"),
        )
        .outerjoin(Prediction, Prediction.location_id == Location.id)
        .filter(Location.is_active.is_(True))
        .group_by(Location.id)
        .all()
    )
    result = []
    for loc_id, name, lat, lon, count in rows:
        latest = (
            db.query(Prediction)
            .filter(Prediction.location_id == loc_id)
            .order_by(Prediction.timestamp.desc())
            .first()
        )
        result.append(
            {
                "location_id": loc_id,
                "name": name,
                "latitude": lat,
                "longitude": lon,
                "prediction_count": count,
                "latest_risk_level": latest.risk_level if latest else None,
                "latest_risk_probability": latest.risk_probability if latest else None,
            }
        )
    return result


def analytics_timeline(db: Session, days: int = 30) -> list[dict]:
    rows = (
        db.query(func.date(Prediction.timestamp).label("day"), func.count(Prediction.id))
        .group_by("day")
        .order_by("day")
        .all()
    )
    return [{"date": str(day), "count": count} for day, count in rows]


def analytics_alerts(db: Session) -> dict:
    rows = db.query(Alert.alert_level, func.count(Alert.id)).group_by(Alert.alert_level).all()
    by_status = db.query(Alert.status, func.count(Alert.id)).group_by(Alert.status).all()
    return {
        "by_level": {level: count for level, count in rows},
        "by_status": {status: count for status, count in by_status},
    }
