from __future__ import annotations

from fastapi import APIRouter, Query

from app.services import recent_landslides_service

router = APIRouter(prefix="/api/recent-landslides", tags=["recent-landslides"])


@router.get("")
async def recent_landslides(limit: int = Query(800, ge=50, le=2000)):
    """Public. Worldwide landslide points for the last 12 months of the best
    available source, each with a green/yellow/red level (see service docstring)."""
    return await recent_landslides_service.get_recent_year_landslides(limit=limit)
