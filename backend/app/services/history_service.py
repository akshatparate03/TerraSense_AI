from __future__ import annotations

import logging
from functools import lru_cache
from typing import Optional

import pandas as pd

from app.core.config import settings
from app.ml.data_pipeline import clean_catalog, load_raw_catalog

logger = logging.getLogger(__name__)

@lru_cache(maxsize=1)
def _cached_clean_catalog() -> pd.DataFrame:
    raw = load_raw_catalog(str(settings.DATASET_PATH))
    return clean_catalog(raw)


def get_historical_events(
    limit: int = 100,
    offset: int = 0,
    country: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
) -> dict:
    df = _cached_clean_catalog().copy()
    if country:
        df = df[df["country_name"].str.lower() == country.lower()]
    if category:
        df = df[df["landslide_category"].astype(str).str.lower() == category.lower()]
    if search:
        s = search.lower()
        df = df[
            df.get("event_title", pd.Series(dtype=object)).astype(str).str.lower().str.contains(s, na=False)
            | df["country_name"].astype(str).str.lower().str.contains(s, na=False)
        ]
    total = len(df)
    page = df.iloc[offset : offset + limit]
    events = []
    for _, row in page.iterrows():
        events.append(
            {
                "event_id": str(row.get("event_id", "")),
                "title": row.get("event_title", "Unnamed event"),
                "date": str(row.get("event_date", "")),
                "country": row.get("country_name", "unknown"),
                "category": row.get("landslide_category", "unknown"),
                "size": row.get("landslide_size", "unknown"),
                "trigger": row.get("landslide_trigger", "unknown"),
                "fatality_count": None if pd.isna(row.get("fatality_count")) else float(row.get("fatality_count")),
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
            }
        )
    return {"total": total, "limit": limit, "offset": offset, "events": events}


def get_locations(limit: int = 300) -> list[dict]:
    df = _cached_clean_catalog().copy().head(limit)
    return [
        {
            "id": str(row.get("event_id", i)),
            "name": row.get("event_title", row.get("country_name", "Location")),
            "country": row.get("country_name", "unknown"),
            "latitude": float(row["latitude"]),
            "longitude": float(row["longitude"]),
            "category": row.get("landslide_category", "unknown"),
            "size": row.get("landslide_size", "unknown"),
        }
        for i, (_, row) in enumerate(df.iterrows())
    ]


def get_analytics() -> dict:
    df = _cached_clean_catalog()
    numeric_summary = {}
    return {
        "total_events": int(len(df)),
        "size_distribution": df["landslide_size"].value_counts().to_dict(),
        "category_distribution": df["landslide_category"].value_counts().to_dict(),
        "trigger_rain_fraction": float(df["trigger_is_rain"].mean()),
        "trigger_seismic_fraction": float(df["trigger_is_seismic"].mean()),
        "monthly_distribution": df["month"].value_counts().sort_index().to_dict(),
        "country_distribution_top15": df["country_name"].value_counts().head(15).to_dict(),
        "fatality_count_describe": {
            k: (None if pd.isna(v) else float(v))
            for k, v in pd.to_numeric(df.get("fatality_count"), errors="coerce").describe().to_dict().items()
        },
    }

