"""
Live Global Scan API (spec-honest replacement for the old simulation-backed
"Live Monitoring" page). See app/services/global_scan_service.py for the
full explanation of what this does and does not do.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import db_service, global_scan_service

router = APIRouter(prefix="/api/scan", tags=["global-scan"])


@router.get("/locations")
async def scan_watchlist(db: Session = Depends(get_db)):
    """The real, named locations a scan checks -- for the frontend to show
    'checking N real regions worldwide' rather than a vague claim."""
    locations = db_service.list_locations(db, active_only=True)
    return {
        "total": len(locations),
        "locations": [
            {"id": l.id, "name": l.name, "country": l.country, "latitude": l.latitude, "longitude": l.longitude}
            for l in locations
        ],
    }


@router.post("/run")
async def run_scan(db: Session = Depends(get_db)):
    """One-shot synchronous scan -- waits for every location to be checked
    and returns the full result set. For a live progress feed as each
    location completes, use the WS endpoint below instead."""
    return await global_scan_service.run_global_scan(db)


@router.get("/latest")
async def latest_scan_results(db: Session = Depends(get_db)):
    """Most recent real prediction per watchlist location, without
    triggering a new scan -- lets the frontend show last-known results
    immediately on page load."""
    locations = db_service.list_locations(db, active_only=True)
    results = []
    for loc in locations:
        pred = db_service.get_latest_prediction_for_location(db, loc.id)
        results.append(
            {
                "location_id": loc.id,
                "name": loc.name,
                "country": loc.country,
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "probability": pred.risk_probability if pred else None,
                "risk_level": pred.risk_level if pred else None,
                "checked_at": pred.timestamp.isoformat() if pred else None,
            }
        )
    results.sort(key=lambda r: r["probability"] if r["probability"] is not None else -1, reverse=True)
    return {"results": results}
