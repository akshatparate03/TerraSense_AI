from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import db_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview")
async def overview(db: Session = Depends(get_db)):
    return db_service.analytics_overview(db)


@router.get("/risk-distribution")
async def risk_distribution(db: Session = Depends(get_db)):
    return db_service.analytics_risk_distribution(db)


@router.get("/location-summary")
async def location_summary(db: Session = Depends(get_db)):
    return {"items": db_service.analytics_location_summary(db)}


@router.get("/timeline")
async def timeline(db: Session = Depends(get_db), days: int = 30):
    return {"items": db_service.analytics_timeline(db, days)}


@router.get("/alerts")
async def alerts_analytics(db: Session = Depends(get_db)):
    return db_service.analytics_alerts(db)
