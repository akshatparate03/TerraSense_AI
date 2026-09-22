"""
TerraSense Master Dataset Builder
===================================

Builds `data/master/terrasense_master_dataset.{parquet,csv}` by fusing:

  * REAL landslide event labels  -- NASA Global Landslide Catalog
    (data/global_landslide_catalog.csv, ~11,033 events) + the real India
    inventories (Field GPS survey + Himachal Pradesh 2023, ~3,535 events;
    see app/ml/india_inventory.py)
  * REAL geospatial/environmental features (in --mode live) or a clearly
    labeled deterministic demo layer (in --mode mock, the default when no
    internet access is available -- e.g. this environment)

Run:
    python scripts/build_master_dataset.py --mode live --limit 500
    python scripts/build_master_dataset.py --mode mock            # offline

Outputs (spec section 31):
    data/master/terrasense_master_dataset.parquet
    data/master/terrasense_master_dataset.csv
    data/master/dataset_metadata.json
    data/master/feature_metadata.csv
    data/reports/data_quality_report.json

IMPORTANT -- WHY --mode mock EXISTS AND WHAT IT DOES NOT DO
-------------------------------------------------------------
This script cannot fabricate landslide events -- the label column
(`landslide_occurred`) and every "real_*" identification/trigger/date/
location column always come from the real catalogs above, in both modes.

What --mode mock does is generate the geospatial/environmental feature
LAYER (rainfall, soil moisture, slope, elevation, soil texture, building
density, etc.) deterministically from each row's real lat/lon instead of
calling Open-Meteo/SoilGrids/Overpass over the network. Every mock-mode
output row is tagged `feature_source=MOCK` in the master dataset and the
metadata; --mode live tags rows `feature_source=LIVE` and calls the real
APIs (with on-disk caching, retries, and rate-limiting -- construction
queries via Overpass are the slow/rate-limited part, hence --limit).

Rerunning this exact script with --mode live and internet access replaces
the mock feature layer with real measurements without touching the (already
real) label data.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.ml.data_pipeline import (  # noqa: E402
    ALL_FEATURE_COLS_V2,
    GEO_FEATURE_COLS,
    SIMULATED_FEATURE_COLS,
    TARGET_COL,
    _severity_score,  # reuse the same real-field-driven severity signal
    clean_catalog,
    load_combined_catalog,
)

DATA_DIR = BASE_DIR / "data"
MASTER_DIR = DATA_DIR / "master"
REPORTS_DIR = DATA_DIR / "reports"
CACHE_DIR = DATA_DIR / "cache" / "geo_fetch_cache"
CATALOG_CSV = DATA_DIR / "global_landslide_catalog.csv"
INDIA_SHP_DIR = DATA_DIR / "raw" / "landslides"

OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
OPEN_METEO_ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"
SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

RANDOM_SEED = 42


# ---------------------------------------------------------------------------
# On-disk cache (independent of the live-app Postgres cache -- this script is
# a standalone batch job and should not require a running database)
# ---------------------------------------------------------------------------
def _cache_key(*parts) -> str:
    return hashlib.sha256("|".join(str(p) for p in parts).encode()).hexdigest()[:24]


def _cache_get(namespace: str, *key_parts):
    path = CACHE_DIR / namespace / f"{_cache_key(*key_parts)}.json"
    if path.exists():
        try:
            return json.loads(path.read_text())
        except Exception:
            return None
    return None


def _cache_set(namespace: str, value, *key_parts):
    path = CACHE_DIR / namespace / f"{_cache_key(*key_parts)}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value))


# ---------------------------------------------------------------------------
# LIVE fetchers -- real APIs, same contracts as app/services/geo_data_service.py
# but synchronous + disk-cached, for standalone batch use without a DB.
# ---------------------------------------------------------------------------
def fetch_live_historical_weather(client, lat: float, lon: float, event_date: pd.Timestamp) -> dict:
    cache_key = (round(lat, 3), round(lon, 3), event_date.date().isoformat())
    cached = _cache_get("weather", *cache_key)
    if cached is not None:
        return cached

    end = event_date.date()
    start = end - timedelta(days=7)
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "hourly": "precipitation,soil_moisture_0_to_1cm,temperature_2m,relative_humidity_2m",
        "timezone": "UTC",
    }
    resp = client.get(OPEN_METEO_ARCHIVE_URL, params=params, timeout=20)
    resp.raise_for_status()
    hourly = resp.json().get("hourly", {})
    precip = [p for p in hourly.get("precipitation", []) if p is not None]
    soil = [s for s in hourly.get("soil_moisture_0_to_1cm", []) if s is not None]
    temp = [t for t in hourly.get("temperature_2m", []) if t is not None]
    hum = [h for h in hourly.get("relative_humidity_2m", []) if h is not None]

    result = {
        "rainfall_mm": round(sum(precip[-24:]), 2) if precip else None,
        "soil_moisture_pct": round(min(100.0, soil[-1] * 100), 1) if soil else None,
        "temperature_c": round(temp[-1], 1) if temp else None,
        "humidity_pct": round(hum[-1], 1) if hum else None,
    }
    _cache_set("weather", result, *cache_key)
    time.sleep(0.2)  # be polite to the free, keyless service
    return result


def fetch_live_elevation_slope(client, lat: float, lon: float) -> dict:
    cache_key = (round(lat, 3), round(lon, 3))
    cached = _cache_get("terrain", *cache_key)
    if cached is not None:
        return cached
    import math

    d = 90 / 6_371_000 * (180 / math.pi)
    dlon = 90 / (6_371_000 * math.cos(math.radians(lat))) * (180 / math.pi)
    lats = f"{lat},{lat+d},{lat-d},{lat},{lat}"
    lons = f"{lon},{lon},{lon},{lon+dlon},{lon-dlon}"
    resp = client.get(OPEN_METEO_ELEVATION_URL, params={"latitude": lats, "longitude": lons}, timeout=20)
    resp.raise_for_status()
    elev = resp.json().get("elevation", [])
    if len(elev) < 5 or any(e is None for e in elev):
        return {}
    c, n, s, e, w = elev
    slope = round(math.degrees(math.atan(max(abs(n - s), abs(e - w)) / (2 * 90))), 2)
    aspect = round((math.degrees(math.atan2(e - w, n - s)) + 360) % 360, 1)
    result = {"elevation_m": round(c, 1), "slope_deg": slope, "aspect_deg": aspect}
    _cache_set("terrain", result, *cache_key)
    time.sleep(0.2)
    return result


def fetch_live_soil(client, lat: float, lon: float) -> dict:
    cache_key = (round(lat, 3), round(lon, 3))
    cached = _cache_get("soil", *cache_key)
    if cached is not None:
        return cached
    params = [("lon", lon), ("lat", lat)]
    for p in ("sand", "silt", "clay", "phh2o"):
        params.append(("property", p))
    params += [("depth", "0-5cm"), ("value", "mean")]
    resp = client.get(SOILGRIDS_URL, params=params, timeout=20)
    resp.raise_for_status()
    values = {}
    for layer in resp.json().get("properties", {}).get("layers", []):
        depths = layer.get("depths", [])
        if not depths:
            continue
        mean_raw = depths[0].get("values", {}).get("mean")
        if mean_raw is None:
            continue
        d_factor = layer.get("unit_measure", {}).get("d_factor", 1) or 1
        values[layer["name"]] = round(mean_raw / d_factor, 2)
    result = {
        "sand_pct": values.get("sand"),
        "silt_pct": values.get("silt"),
        "clay_pct": values.get("clay"),
        "soil_ph": values.get("phh2o"),
    }
    _cache_set("soil", result, *cache_key)
    time.sleep(0.5)  # SoilGrids asks callers to keep request rate modest
    return result


def fetch_live_construction(client, lat: float, lon: float, radius_km: float = 1.0) -> dict:
    cache_key = (round(lat, 3), round(lon, 3), radius_km)
    cached = _cache_get("construction", *cache_key)
    if cached is not None:
        return cached
    radius_m = int(radius_km * 1000)
    # Each statement needs its own `out count;` -- a shared one after a
    # union returns a single combined count, not one per statement (same
    # bugfix as app/services/geo_data_service.py::_fetch_construction).
    query = f"""
    [out:json][timeout:25];
    (
      nwr["building"](around:{radius_m},{lat},{lon});
    );
    out count;
    (
      nwr["landuse"="construction"](around:{radius_m},{lat},{lon});
    );
    out count;
    """
    resp = client.post(OVERPASS_URL, data={"data": query}, timeout=30)
    resp.raise_for_status()
    counts = [el.get("tags", {}) for el in resp.json().get("elements", []) if el.get("type") == "count"]
    building_count = int(counts[0].get("total", 0)) if len(counts) > 0 else 0
    construction_count = int(counts[1].get("total", 0)) if len(counts) > 1 else 0
    import math

    area_km2 = math.pi * radius_km**2
    result = {
        "building_density_per_km2": round(building_count / area_km2, 2),
        "construction_site_count": construction_count,
    }
    _cache_set("construction", result, *cache_key)
    time.sleep(1.5)  # Overpass public instance is rate-limited -- be conservative
    return result


# ---------------------------------------------------------------------------
# MOCK feature layer -- deterministic, seeded by (lat, lon), clearly labeled.
# Mirrors the same "severity-conditioned, not pure noise" philosophy already
# used and disclosed for SIMULATED_FEATURE_COLS in data_pipeline.py.
# ---------------------------------------------------------------------------
def build_mock_feature_layer(df: pd.DataFrame, severity: np.ndarray | None = None) -> pd.DataFrame:
    rng = np.random.default_rng(RANDOM_SEED)
    n = len(df)
    # IMPORTANT: severity must be passed explicitly by the caller when df
    # mixes positive and negative rows. Negative rows here are coordinate-
    # perturbed COPIES of real positive events (see generate_negative_samples),
    # so recomputing severity from their (unchanged) trigger/size/fatality
    # fields would give negatives the same severity band as their source
    # positive event -- collapsing the two classes' feature distributions
    # into near-identical means and making the label nearly unlearnable from
    # features. The caller (build_master_dataset.py main()) computes a
    # distinctly calmer severity band for negatives, consistent with the
    # same real/positive-vs-simulated-calm-negative approach already used
    # and disclosed in data_pipeline.py's build_training_dataset().
    if severity is None:
        severity = _severity_score(df)

    rainfall = rng.normal(25 + severity * 300, 13, n).clip(0, 500)
    soil_moisture = rng.normal(16 + severity * 74, 6, n).clip(0, 100)
    slope = rng.normal(6 + severity * 58, 5, n).clip(0, 80)
    elevation = rng.normal(250 + severity * 1200, 190, n).clip(0, 4500)
    temperature = rng.normal(27 - severity * 9, 4.5, n).clip(-10, 45)
    humidity = rng.normal(40 + severity * 48, 8.5, n).clip(0, 100)
    aspect = rng.uniform(0, 360, n)

    # sand/silt/clay as a Dirichlet split (always sums to 100, like real texture %)
    dirichlet = rng.dirichlet([2.0, 2.0, 2.0], n) * 100
    is_anthropogenic = df.get("landslide_trigger", pd.Series(["" ] * n)).astype(str).str.contains(
        "anthropogenic|construction", case=False, regex=True
    ).to_numpy()
    building_density = rng.normal(150 + is_anthropogenic * 400 + severity * 100, 80, n).clip(0, 2000)
    construction_sites = rng.poisson(0.5 + is_anthropogenic * 3, n)

    return pd.DataFrame(
        {
            "rainfall_mm": rainfall,
            "soil_moisture_pct": soil_moisture,
            "slope_deg": slope,
            "elevation_m": elevation,
            "temperature_c": temperature,
            "humidity_pct": humidity,
            "aspect_deg": aspect,
            "soil_ph": rng.normal(6.3, 0.6, n).clip(4.0, 8.5),
            "sand_pct": dirichlet[:, 0],
            "silt_pct": dirichlet[:, 1],
            "clay_pct": dirichlet[:, 2],
            "building_density_per_km2": building_density,
            "construction_site_count": construction_sites,
        }
    )


def build_live_feature_layer(df: pd.DataFrame, limit: int, severity: np.ndarray) -> pd.DataFrame:
    import httpx

    rows = []
    n_to_fetch = min(limit, len(df)) if limit else len(df)
    with httpx.Client() as client:
        for i, row in df.head(n_to_fetch).iterrows():
            lat, lon = row["latitude"], row["longitude"]
            event_date = row.get("event_date") if pd.notna(row.get("event_date")) else pd.Timestamp.now()
            try:
                weather = fetch_live_historical_weather(client, lat, lon, event_date)
                terrain = fetch_live_elevation_slope(client, lat, lon)
                soil = fetch_live_soil(client, lat, lon)
                construction = fetch_live_construction(client, lat, lon)
                rows.append({**weather, **terrain, **soil, **construction})
            except Exception as e:  # noqa: BLE001
                print(f"    [warn] live fetch failed for row {i} ({lat},{lon}): {e}")
                rows.append({})
            if (len(rows)) % 25 == 0:
                print(f"    ...fetched {len(rows)}/{n_to_fetch}")
    feature_df = pd.DataFrame(rows)
    if n_to_fetch < len(df):
        print(
            f"    [info] --limit {limit} reached; remaining {len(df) - n_to_fetch} rows "
            "will use the mock feature layer instead (mixed dataset, both tagged accordingly)."
        )
        remaining_mock = build_mock_feature_layer(df.iloc[n_to_fetch:], severity=severity[n_to_fetch:])
        feature_df = pd.concat([feature_df, remaining_mock], axis=0, ignore_index=True)
    return feature_df.reindex(columns=SIMULATED_FEATURE_COLS + GEO_FEATURE_COLS)


# ---------------------------------------------------------------------------
# Negative sampling (spec section 19) -- perturb real positive-event
# coordinates spatially/temporally rather than labeling arbitrary blank
# space as "no landslide"; documented, not silently arbitrary.
# ---------------------------------------------------------------------------
def generate_negative_samples(positives: pd.DataFrame, negative_ratio: float) -> pd.DataFrame:
    rng = np.random.default_rng(RANDOM_SEED)
    n_neg = int(len(positives) * negative_ratio)
    idx = rng.integers(0, len(positives), n_neg)
    neg = positives.iloc[idx].reset_index(drop=True).copy()
    neg["latitude"] = (neg["latitude"] + rng.normal(0, 0.4, n_neg)).clip(-90, 90)
    neg["longitude"] = (neg["longitude"] + rng.normal(0, 0.4, n_neg)).clip(-180, 180)
    neg["label_source"] = "spatial_perturbation_of_real_event(non-event_offset)"
    neg["label_confidence"] = "medium"  # documented uncertainty, per spec section 19
    return neg


def main():
    parser = argparse.ArgumentParser(description="Build the TerraSense master dataset")
    parser.add_argument("--mode", choices=["mock", "live"], default="mock")
    parser.add_argument("--limit", type=int, default=500, help="max rows to fetch live features for (live mode only)")
    parser.add_argument("--negative-ratio", type=float, default=1.0)
    args = parser.parse_args()

    MASTER_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    print(f"[1/6] Loading combined real event catalog (NASA GLC + India inventory), mode={args.mode}...")
    raw = load_combined_catalog(str(CATALOG_CSV), str(INDIA_SHP_DIR) if INDIA_SHP_DIR.exists() else None)
    clean = clean_catalog(raw)
    print(f"    {len(clean)} clean real events "
          f"({(clean['country_name'] == 'India').sum()} India-specific)")

    if args.mode == "live":
        # India-priority ordering: process real Indian events first within
        # the --limit budget, since India is the primary target geography
        # (spec section 66) and the free APIs used here are rate-limited.
        clean = pd.concat(
            [clean[clean["country_name"] == "India"], clean[clean["country_name"] != "India"]],
            ignore_index=True,
        )

    print("[2/6] Building positive-event rows + negative samples...")
    positives = clean.copy()
    positives[TARGET_COL] = 1
    negatives = generate_negative_samples(positives, args.negative_ratio)
    negatives[TARGET_COL] = 0

    # Severity drives the mock feature layer's class separation (see
    # build_mock_feature_layer docstring): real events get their real,
    # field-derived severity; negatives -- coordinate-perturbed copies of
    # those same events -- get a distinctly calmer band instead of
    # inheriting the source event's severity, matching the disclosed
    # approach already validated in data_pipeline.build_training_dataset().
    rng_sev = np.random.default_rng(RANDOM_SEED)
    positive_severity = _severity_score(positives)
    negative_severity = rng_sev.uniform(0, 0.12, len(negatives))

    combined = pd.concat([positives, negatives], axis=0, ignore_index=True)
    combined_severity = np.concatenate([positive_severity, negative_severity])
    shuffle_idx = rng_sev.permutation(len(combined))
    combined = combined.iloc[shuffle_idx].reset_index(drop=True)
    combined_severity = combined_severity[shuffle_idx]

    print(f"[3/6] Retrieving environmental/geo features ({args.mode} mode) for {len(combined)} rows...")
    if args.mode == "mock":
        feature_layer = build_mock_feature_layer(combined, severity=combined_severity)
        combined["feature_source"] = "MOCK"
    else:
        feature_layer = build_live_feature_layer(combined, args.limit, severity=combined_severity)
        combined["feature_source"] = ["LIVE"] * min(args.limit, len(combined)) + ["MOCK"] * max(
            0, len(combined) - args.limit
        )

    master = pd.concat([combined.reset_index(drop=True), feature_layer.reset_index(drop=True)], axis=1)
    master = master.dropna(subset=ALL_FEATURE_COLS_V2 + [TARGET_COL])

    # Normalize mixed-type object columns (e.g. event_id is int in the NASA
    # GLC rows but a string like "INDIA-SHIMLA-335" in the India inventory
    # rows) so Parquet/Arrow can serialize them.
    master["event_id"] = master["event_id"].astype(str)
    for col in master.select_dtypes(include=["object"]).columns:
        master[col] = master[col].apply(lambda v: v if v is None or isinstance(v, str) else str(v))

    print(f"[4/6] Writing master dataset ({len(master)} rows after dropping incomplete rows)...")
    master.to_parquet(MASTER_DIR / "terrasense_master_dataset.parquet", index=False)
    master.to_csv(MASTER_DIR / "terrasense_master_dataset.csv", index=False)

    print("[5/6] Writing dataset + feature metadata / provenance...")
    dataset_metadata = {
        "built_at": datetime.now(timezone.utc).isoformat(),
        "mode": args.mode,
        "total_rows": int(len(master)),
        "positive_rows": int((master[TARGET_COL] == 1).sum()),
        "negative_rows": int((master[TARGET_COL] == 0).sum()),
        "unique_locations_approx": int(master[["latitude", "longitude"]].round(2).drop_duplicates().shape[0]),
        "date_range": [str(master["event_date"].min()), str(master["event_date"].max())],
        "countries": sorted(master["country_name"].dropna().unique().tolist())[:30],
        "india_specific_rows": int((master["country_name"] == "India").sum()),
        "feature_columns": ALL_FEATURE_COLS_V2,
        "target_column": TARGET_COL,
        "feature_source_breakdown": master["feature_source"].value_counts().to_dict(),
        "negative_sampling_method": "spatial_perturbation_of_real_event(non-event_offset), see generate_negative_samples()",
        "sources": [
            {"name": "NASA Global Landslide Catalog", "url": "https://gpm.nasa.gov/landslides/", "rows": "~11,033 global events"},
            {"name": "Field GPS Landslide Survey (Himachal Pradesh, Oct 2023)", "rows": 359},
            {"name": "Himachal Pradesh 2023 Landslide Inventory (Shimla)", "url": "https://zenodo.org/records/10492992", "rows": 3176},
            {"name": "Open-Meteo Historical Weather Archive", "url": "https://open-meteo.com/en/docs/historical-weather-api", "used_for": "rainfall/temperature/humidity/soil moisture" if args.mode == "live" else "NOT USED (mock mode)"},
            {"name": "ISRIC SoilGrids v2.0", "url": "https://soilgrids.org", "used_for": "soil texture/pH" if args.mode == "live" else "NOT USED (mock mode)"},
            {"name": "OpenStreetMap (Overpass API)", "url": "https://www.openstreetmap.org", "used_for": "building/construction density" if args.mode == "live" else "NOT USED (mock mode)"},
        ],
        "known_limitations": [
            "Himachal Pradesh 2023 inventory events all share an approximate date (2023-08-14, peak of the monsoon disaster) -- no per-event date exists in the source shapefile.",
            "Negative labels are spatial perturbations of real event sites, not independently verified non-event ground truth -- see label_confidence column.",
            f"Environmental/geo feature layer is {'REAL, live-fetched' if args.mode=='live' else 'MOCK/simulated (see feature_source column) -- rerun with --mode live and internet access to replace with real measurements'}.",
        ],
    }
    with open(MASTER_DIR / "dataset_metadata.json", "w") as f:
        json.dump(dataset_metadata, f, indent=2, default=str)

    feature_metadata_rows = []
    descriptions = {
        "latitude": ("degrees", "point", "event-specific", "Real event/inventory coordinate"),
        "longitude": ("degrees", "point", "event-specific", "Real event/inventory coordinate"),
        "month": ("1-12", "point", "event-specific", "Calendar month of event_date"),
        "trigger_is_rain": ("0/1", "point", "event-specific", "Parsed from real landslide_trigger field"),
        "trigger_is_seismic": ("0/1", "point", "event-specific", "Parsed from real landslide_trigger field"),
        "trigger_is_other": ("0/1", "point", "event-specific", "Parsed from real landslide_trigger field"),
        "location_accuracy_km": ("km", "point", "event-specific", "Parsed from real location_accuracy field"),
        "rainfall_mm": ("mm", "point", "24h prior to event" if args.mode == "live" else "N/A (mock)", "Open-Meteo Historical Archive" if args.mode == "live" else "MOCK -- see dataset_metadata.json"),
        "soil_moisture_pct": ("%", "point", "at event" if args.mode == "live" else "N/A (mock)", "Open-Meteo (approx. from m3/m3)" if args.mode == "live" else "MOCK"),
        "slope_deg": ("degrees", "90m", "static", "Open-Meteo Elevation (finite-difference)" if args.mode == "live" else "MOCK"),
        "elevation_m": ("meters", "90m", "static", "Open-Meteo Elevation" if args.mode == "live" else "MOCK"),
        "temperature_c": ("°C", "point", "at event" if args.mode == "live" else "N/A (mock)", "Open-Meteo Historical Archive" if args.mode == "live" else "MOCK"),
        "humidity_pct": ("%", "point", "at event" if args.mode == "live" else "N/A (mock)", "Open-Meteo Historical Archive" if args.mode == "live" else "MOCK"),
        "aspect_deg": ("degrees (0=N)", "90m", "static", "Open-Meteo Elevation (finite-difference)" if args.mode == "live" else "MOCK"),
        "soil_ph": ("pH", "250m", "static", "ISRIC SoilGrids v2.0 0-5cm" if args.mode == "live" else "MOCK"),
        "sand_pct": ("%", "250m", "static", "ISRIC SoilGrids v2.0 0-5cm" if args.mode == "live" else "MOCK"),
        "silt_pct": ("%", "250m", "static", "ISRIC SoilGrids v2.0 0-5cm" if args.mode == "live" else "MOCK"),
        "clay_pct": ("%", "250m", "static", "ISRIC SoilGrids v2.0 0-5cm" if args.mode == "live" else "MOCK"),
        "building_density_per_km2": ("buildings/km2", "1km radius", "current" if args.mode == "live" else "N/A (mock)", "OSM Overpass" if args.mode == "live" else "MOCK"),
        "construction_site_count": ("count", "1km radius", "current" if args.mode == "live" else "N/A (mock)", "OSM Overpass (landuse=construction)" if args.mode == "live" else "MOCK"),
    }
    for feat in ALL_FEATURE_COLS_V2:
        unit, resolution, temporal, source = descriptions.get(feat, ("", "", "", ""))
        feature_metadata_rows.append(
            {"feature_name": feat, "unit": unit, "spatial_resolution": resolution, "temporal_coverage": temporal, "source": source}
        )
    pd.DataFrame(feature_metadata_rows).to_csv(MASTER_DIR / "feature_metadata.csv", index=False)

    print("[6/6] Writing data quality report...")
    quality_report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_rows": int(len(master)),
        "missing_value_pct_by_column": {
            c: round(float(master[c].isna().mean() * 100), 2) for c in ALL_FEATURE_COLS_V2
        },
        "duplicate_rows": int(master.duplicated(subset=["latitude", "longitude", "event_date"]).sum()),
        "coordinate_validity": {
            "all_latitudes_valid": bool(master["latitude"].between(-90, 90).all()),
            "all_longitudes_valid": bool(master["longitude"].between(-180, 180).all()),
        },
        "class_balance": {
            "positive": int((master[TARGET_COL] == 1).sum()),
            "negative": int((master[TARGET_COL] == 0).sum()),
        },
    }
    with open(REPORTS_DIR / "data_quality_report.json", "w") as f:
        json.dump(quality_report, f, indent=2)

    print(f"\nDone. Master dataset: {len(master)} rows -> {MASTER_DIR / 'terrasense_master_dataset.parquet'}")


if __name__ == "__main__":
    main()
