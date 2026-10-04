"""
Last-12-months worldwide landslide points for the Home page 3D terrain.

Source order (first one that works wins):
  1. NASA COOLR / Global Landslide Catalog public ArcGIS layer (live, keyless).
  2. The NASA Global Landslide Catalog CSV bundled with this project.

IMPORTANT honesty note: the bundled CSV ends in Sept 2017, so when source (2)
is used the "last year" window is the final 12 months OF THAT DATASET, not the
calendar year before today. The response says so explicitly (`is_current`,
`window_start`, `window_end`, `note`) and the UI shows it -- nothing is
presented as more recent than it is.

Colour logic (documented, deterministic):
  HIGH   (red)    -> at least one fatality, or size large / very_large / catastrophic
  MEDIUM (yellow) -> size medium, or at least one injury
  LOW    (green)  -> everything else (small / unknown size, no reported casualties)
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import httpx
import pandas as pd

from app.core.config import settings

logger = logging.getLogger(__name__)

_RANK = {"HIGH": 2, "MEDIUM": 1, "LOW": 0}
_CACHE: dict[str, Any] = {"at": 0.0, "limit": 0, "data": None}


def classify_event(size: Any, fatalities: Any, injuries: Any = None) -> str:
    size_s = str(size or "").strip().lower().replace(" ", "_")
    fat = _num(fatalities)
    inj = _num(injuries)
    if fat >= 1 or size_s in {"large", "very_large", "catastrophic"}:
        return "HIGH"
    if size_s == "medium" or inj >= 1:
        return "MEDIUM"
    return "LOW"


def _num(v: Any) -> float:
    try:
        f = float(v)
        return 0.0 if f != f else f  # NaN -> 0
    except (TypeError, ValueError):
        return 0.0


def _clean_str(v: Any, default: str = "") -> str:
    if v is None:
        return default
    s = str(v).strip()
    return default if s.lower() in {"", "nan", "none", "nat"} else s


def _build_result(records: list[dict], source: str, limit: int) -> dict:
    """records: dicts with keys date(datetime), lat, lon, title, country, size,
    fatalities, injuries, category."""
    records = [r for r in records if r["date"] is not None and -90 <= r["lat"] <= 90 and -180 <= r["lon"] <= 180]
    if not records:
        return {}
    now = datetime.now(timezone.utc)
    latest = max(r["date"] for r in records)
    end = min(now, latest)
    start = end - timedelta(days=365)
    window = [r for r in records if start <= r["date"] <= end]
    if not window:
        return {}

    points = []
    counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for i, r in enumerate(window):
        level = classify_event(r["size"], r["fatalities"], r["injuries"])
        counts[level] += 1
        title = _clean_str(r["title"], "Landslide event")
        points.append(
            {
                "id": i,
                "name": title[:80],
                "country": _clean_str(r["country"]),
                "category": _clean_str(r["category"]),
                "latitude": round(r["lat"], 4),
                "longitude": round(r["lon"], 4),
                "level": level,
                "date": r["date"].date().isoformat(),
                "fatalities": int(_num(r["fatalities"])),
            }
        )
    total = len(points)
    # If there are more points than the 3D scene should draw, keep each colour's
    # share of the whole (so green/yellow/red all stay visible) and, inside each
    # colour, prefer the deadliest / most recent events.
    points.sort(key=lambda p: (p["fatalities"], p["date"]), reverse=True)
    if total > limit:
        kept: list[dict] = []
        for lvl in ("HIGH", "MEDIUM", "LOW"):
            quota = max(1, round(limit * counts[lvl] / total)) if counts[lvl] else 0
            kept.extend([p for p in points if p["level"] == lvl][:quota])
        points = kept[:limit]
    points.sort(key=lambda p: (_RANK[p["level"]], p["fatalities"], p["date"]), reverse=True)

    is_current = (now - end) <= timedelta(days=90)
    if is_current:
        note = f"Landslides reported worldwide between {start.date()} and {end.date()}."
    else:
        note = (
            f"Latest 12 months available in the {source} data: {start.date()} to {end.date()}. "
            "This dataset has no newer reports, so this is NOT the most recent calendar year."
        )
    return {
        "points": points,
        "total_events": total,
        "shown": len(points),
        "counts": counts,
        "shown_counts": {lvl: sum(1 for p in points if p["level"] == lvl) for lvl in ("HIGH", "MEDIUM", "LOW")},
        "window_start": start.date().isoformat(),
        "window_end": end.date().isoformat(),
        "source": source,
        "is_current": is_current,
        "note": note,
    }


# ---------------------------------------------------------------------------
# Source 1: NASA ArcGIS (live)
# ---------------------------------------------------------------------------
async def _fetch_nasa_live(limit: int) -> Optional[dict]:
    params = {
        "where": "1=1",
        "outFields": "*",
        "returnGeometry": "true",
        "outSR": "4326",
        "orderByFields": "event_date DESC",
        "resultRecordCount": "3000",
        "f": "json",
    }
    async with httpx.AsyncClient(timeout=settings.GEO_HTTP_TIMEOUT_SECONDS + 8) as client:
        resp = await client.get(settings.NASA_LANDSLIDE_QUERY_URL, params=params)
        resp.raise_for_status()
        payload = resp.json()
    if "error" in payload or not payload.get("features"):
        logger.warning("NASA landslide layer returned no usable features: %s", str(payload.get("error"))[:200])
        return None

    records: list[dict] = []
    for f in payload["features"]:
        a = {str(k).lower(): v for k, v in (f.get("attributes") or {}).items()}
        geom = f.get("geometry") or {}
        lon = geom.get("x", a.get("longitude"))
        lat = geom.get("y", a.get("latitude"))
        raw_date = a.get("event_date")
        if lon is None or lat is None or raw_date in (None, ""):
            continue
        try:
            dt = datetime.fromtimestamp(float(raw_date) / 1000.0, tz=timezone.utc)
            records.append(
                {
                    "date": dt,
                    "lat": float(lat),
                    "lon": float(lon),
                    "title": a.get("event_title") or a.get("location_description"),
                    "country": a.get("country_name"),
                    "size": a.get("landslide_size"),
                    "fatalities": a.get("fatality_count"),
                    "injuries": a.get("injury_count"),
                    "category": a.get("landslide_category"),
                }
            )
        except (TypeError, ValueError, OverflowError):
            continue
    return _build_result(records, "NASA COOLR (live)", limit) or None


# ---------------------------------------------------------------------------
# Source 2: bundled catalog CSV
# ---------------------------------------------------------------------------
def _from_bundled_catalog(limit: int) -> dict:
    from app.services.history_service import _cached_clean_catalog

    df = _cached_clean_catalog()
    dates = pd.to_datetime(df["event_date"], errors="coerce", utc=True)
    records = []
    for idx, row in df.iterrows():
        d = dates.loc[idx]
        if pd.isna(d):
            continue
        try:
            records.append(
                {
                    "date": d.to_pydatetime(),
                    "lat": float(row["latitude"]),
                    "lon": float(row["longitude"]),
                    "title": row.get("event_title"),
                    "country": row.get("country_name"),
                    "size": row.get("landslide_size"),
                    "fatalities": row.get("fatality_count"),
                    "injuries": row.get("injury_count"),
                    "category": row.get("landslide_category"),
                }
            )
        except (TypeError, ValueError):
            continue
    return _build_result(records, "NASA Global Landslide Catalog (bundled)", limit)


async def get_recent_year_landslides(limit: int = 800) -> dict:
    ttl = settings.RECENT_LANDSLIDES_CACHE_HOURS * 3600
    if _CACHE["data"] and time.time() - _CACHE["at"] < ttl and _CACHE["limit"] >= limit:
        return _CACHE["data"]

    result: Optional[dict] = None
    if settings.RECENT_LANDSLIDES_LIVE:
        try:
            result = await _fetch_nasa_live(limit)
        except Exception as e:  # noqa: BLE001 - any network/parse failure -> fall back
            logger.warning("Live NASA landslide fetch failed, using bundled catalog: %s", e)
    if not result:
        result = _from_bundled_catalog(limit)
    if not result:
        result = {
            "points": [], "total_events": 0, "shown": 0, "counts": {"HIGH": 0, "MEDIUM": 0, "LOW": 0},
            "window_start": None, "window_end": None, "source": "none", "is_current": False,
            "note": "No landslide data available.",
        }

    _CACHE.update({"at": time.time(), "limit": limit, "data": result})
    return result
