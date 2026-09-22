"""
Monitoring Service
====================

Implements the background email-alert loop (spec sections 37-43): for every
active `AlertSubscription`, re-run the live location-prediction pipeline and
decide whether to send an email, using a hysteresis (two-threshold) state
machine so a single risk value hovering near the threshold cannot spam the
user with repeated emails:

    NORMAL --[probability >= alert_threshold]--> send email --> ALERTED
    ALERTED --[probability < reset_threshold]--> NORMAL (no email; just re-arms)

A cooldown (`cooldown_minutes`) additionally guards against sending another
email even if the state machine would otherwise allow it (e.g. the risk
oscillates above/below the alert threshold repeatedly within a short
window).

This module is called by:
  * the APScheduler background job registered in app/main.py (periodic,
    every settings.MONITORING_INTERVAL_MINUTES)
  * POST /api/alerts/test (an on-demand single-subscription check, for the
    user to verify their email/monitoring setup works)
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.ml.inference import ModelNotLoadedError, inference_service
from app.models.db_models import AlertSubscription
from app.services import db_service, email_service
from app.services.geo_data_service import geo_data_engine

logger = logging.getLogger(__name__)


async def check_subscription(db: Session, sub: AlertSubscription, force_email: bool = False) -> dict:
    """Run one risk check for a single subscription and apply the
    hysteresis/cooldown logic. Returns a small result dict for API/testing
    use; never raises for expected failure modes (data unavailable, model
    not loaded) -- those are reported in the result instead."""
    result = {"subscription_id": sub.id, "checked_at": datetime.now(timezone.utc).isoformat()}

    try:
        geo = await geo_data_engine.analyze_location(db, sub.latitude, sub.longitude, sub.radius_km)
    except Exception as e:  # noqa: BLE001
        logger.warning(f"Monitoring: geo fetch failed for subscription {sub.id}: {e}")
        result.update(status="error", message=str(e))
        return result

    if not geo["model_input_ready"]:
        result.update(status="data_unavailable", data_status=geo["data_status"])
        return result

    features = dict(geo["model_input_features"])
    features["latitude"] = sub.latitude
    features["longitude"] = sub.longitude
    features["trigger_hint"] = "rain"
    features["location_accuracy_km"] = sub.radius_km
    soil, construction, elevation_slope = geo.get("soil") or {}, geo.get("construction") or {}, geo.get("elevation_slope") or {}
    if soil.get("status") != "UNAVAILABLE":
        features.update(soil_ph=soil.get("soil_ph"), sand_pct=soil.get("sand_pct"), silt_pct=soil.get("silt_pct"), clay_pct=soil.get("clay_pct"))
    if construction.get("status") != "UNAVAILABLE":
        features.update(
            building_density_per_km2=construction.get("building_density_per_km2"),
            construction_site_count=construction.get("active_construction_site_count"),
        )
    if elevation_slope.get("status") != "UNAVAILABLE":
        features["aspect_deg"] = elevation_slope.get("aspect_deg")

    try:
        prediction = inference_service.predict(features)
    except ModelNotLoadedError as e:
        result.update(status="error", message=str(e))
        return result

    probability = prediction["landslide_probability"]
    risk_level = prediction["risk_level"]
    now = datetime.now(timezone.utc)

    sub.last_checked_at = now
    sub.last_probability = probability

    email_sent = False
    cooldown_elapsed = (
        sub.last_alert_sent_at is None
        or (now - sub.last_alert_sent_at).total_seconds() >= sub.cooldown_minutes * 60
    )

    should_alert = force_email or (
        probability >= sub.alert_threshold and sub.alert_state == "NORMAL" and cooldown_elapsed
    )

    if should_alert:
        delivery_status = "SENT"
        try:
            ok = email_service.send_landslide_alert_email(
                to_email=sub.email,
                location_label=sub.label,
                latitude=sub.latitude,
                longitude=sub.longitude,
                radius_km=sub.radius_km,
                probability=probability,
                risk_level=risk_level,
                features=prediction["features"],
                risk_drivers=prediction["risk_drivers"],
                timestamp_iso=prediction["timestamp"],
            )
            if not ok:
                # _send_via_apps_script returns False (rather than raising)
                # specifically when APPS_SCRIPT_EMAIL_URL isn't configured --
                # distinguish "not set up yet" from an actual delivery
                # failure so the alert history / test-alert response never
                # implies an email went out when it didn't (spec section 79).
                delivery_status = "DEV_MODE_LOGGED" if not settings.APPS_SCRIPT_EMAIL_URL else "FAILED"
        except Exception as e:  # noqa: BLE001
            logger.error(f"Monitoring: email send failed for subscription {sub.id}: {e}")
            delivery_status = "FAILED"

        db_service.record_email_alert(db, sub, probability, risk_level, delivery_status)
        sub.alert_state = "ALERTED"
        sub.last_alert_sent_at = now
        email_sent = delivery_status == "SENT"
    elif probability < sub.reset_threshold and sub.alert_state == "ALERTED":
        # Hysteresis reset -- re-arms future alerts, no email sent (spec
        # section 42: "Reset threshold... Reset alert state").
        sub.alert_state = "NORMAL"

    db.commit()

    result.update(
        status="ok",
        probability=probability,
        risk_level=risk_level,
        alert_state=sub.alert_state,
        email_sent=email_sent,
        data_quality=geo["data_quality"],
    )
    return result


async def run_monitoring_cycle(db: Session) -> dict:
    """Called by the scheduler. Iterates every active subscription; one
    subscription's failure never stops the others (spec section 97)."""
    if not settings.MONITORING_ENABLED:
        return {"status": "disabled", "checked": 0}

    subs = db_service.list_all_active_subscriptions(db)
    results = []
    for sub in subs:
        try:
            results.append(await check_subscription(db, sub))
        except Exception as e:  # noqa: BLE001
            logger.error(f"Monitoring cycle: unhandled error for subscription {sub.id}: {e}")
            results.append({"subscription_id": sub.id, "status": "error", "message": str(e)})

    emails_sent = sum(1 for r in results if r.get("email_sent"))
    logger.info(f"Monitoring cycle complete: {len(subs)} subscriptions checked, {emails_sent} emails sent")
    return {"status": "ok", "checked": len(subs), "emails_sent": emails_sent, "results": results}
