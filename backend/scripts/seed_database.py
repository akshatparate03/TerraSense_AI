"""
Idempotent database seed script for TerraSense AI.

Run:
    cd backend
    python scripts/seed_database.py

What it does (safe to re-run):
1. Creates a curated set of real, named monitoring locations (landslide-prone
   regions) with real coordinates -- NOT fabricated sensor installations, just
   geographic reference points used for the simulation/demo predictions.
2. Imports real historical landslide events from the NASA Global Landslide
   Catalog CSV into the `landslide_events` table (skips rows already imported
   by event_id, tracked via `dataset_reference`).
3. Registers the trained model(s) from backend/artifacts/model_comparison.json
   and backend/models/model_metadata.json into the `model_runs` table, marking
   the selected model as active. Requires `python train_model.py` to have been
   run first.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.ml.data_pipeline import clean_catalog, load_raw_catalog  # noqa: E402
from app.models.db_models import LandslideEvent, Location, ModelRun  # noqa: E402

# Curated set of real, well-known landslide-prone regions (mixed India + global)
# used as reference monitoring locations for the demo/prediction workflow.
# These are geographic reference points, not claims of installed physical sensors.
CURATED_LOCATIONS = [
    {"name": "Shimla, Himachal Pradesh", "region": "Himachal Pradesh", "country": "India", "latitude": 31.1048, "longitude": 77.1734, "elevation": 2205},
    {"name": "Mussoorie, Uttarakhand", "region": "Uttarakhand", "country": "India", "latitude": 30.4598, "longitude": 78.0664, "elevation": 2005},
    {"name": "Gangtok, Sikkim", "region": "Sikkim", "country": "India", "latitude": 27.3389, "longitude": 88.6065, "elevation": 1650},
    {"name": "Itanagar, Arunachal Pradesh", "region": "Arunachal Pradesh", "country": "India", "latitude": 27.0844, "longitude": 93.6053, "elevation": 350},
    {"name": "Darjeeling, West Bengal", "region": "West Bengal", "country": "India", "latitude": 27.0410, "longitude": 88.2663, "elevation": 2050},
    {"name": "Munnar, Kerala", "region": "Kerala", "country": "India", "latitude": 10.0889, "longitude": 77.0595, "elevation": 1600},
    {"name": "Chittagong Hill Tracts", "region": "Chittagong", "country": "Bangladesh", "latitude": 22.6667, "longitude": 92.2000, "elevation": 610},
    {"name": "Baguio City", "region": "Cordillera", "country": "Philippines", "latitude": 16.4023, "longitude": 120.5960, "elevation": 1540},
    {"name": "Kathmandu Valley", "region": "Bagmati", "country": "Nepal", "latitude": 27.7172, "longitude": 85.3240, "elevation": 1400},
    {"name": "Rio de Janeiro Hillsides", "region": "Rio de Janeiro", "country": "Brazil", "latitude": -22.9068, "longitude": -43.1729, "elevation": 200},
    {"name": "Coorg, Karnataka", "region": "Karnataka", "country": "India", "latitude": 12.3375, "longitude": 75.8069, "elevation": 1525},
    {"name": "Wayanad, Kerala", "region": "Kerala", "country": "India", "latitude": 11.6854, "longitude": 76.1320, "elevation": 2100},
    {"name": "Nainital, Uttarakhand", "region": "Uttarakhand", "country": "India", "latitude": 29.3803, "longitude": 79.4636, "elevation": 2084},
    {"name": "Aizawl, Mizoram", "region": "Mizoram", "country": "India", "latitude": 23.7271, "longitude": 92.7176, "elevation": 1132},
    {"name": "Shillong, Meghalaya", "region": "Meghalaya", "country": "India", "latitude": 25.5788, "longitude": 91.8933, "elevation": 1496},
    {"name": "Pokhara, Gandaki", "region": "Gandaki", "country": "Nepal", "latitude": 28.2096, "longitude": 83.9856, "elevation": 827},
    {"name": "Chiang Mai Highlands", "region": "Chiang Mai", "country": "Thailand", "latitude": 18.7883, "longitude": 98.9853, "elevation": 310},
    {"name": "Bogor Hills", "region": "West Java", "country": "Indonesia", "latitude": -6.5950, "longitude": 106.8166, "elevation": 265},
    {"name": "Medellin Hillsides", "region": "Antioquia", "country": "Colombia", "latitude": 6.2442, "longitude": -75.5812, "elevation": 1495},
    {"name": "Quito Slopes", "region": "Pichincha", "country": "Ecuador", "latitude": -0.1807, "longitude": -78.4678, "elevation": 2850},
    {"name": "Kigali Hills", "region": "Kigali", "country": "Rwanda", "latitude": -1.9403, "longitude": 30.0619, "elevation": 1567},
    {"name": "Sochi Highlands", "region": "Krasnodar Krai", "country": "Russia", "latitude": 43.6028, "longitude": 39.7342, "elevation": 200},
    {"name": "Chuuk Terraces", "region": "Chuuk", "country": "Micronesia", "latitude": 7.4197, "longitude": 151.7963, "elevation": 143},
    {"name": "Salzburg Alpine Slopes", "region": "Salzburg", "country": "Austria", "latitude": 47.8095, "longitude": 13.0550, "elevation": 424},
    {"name": "Kobe Hillside District", "region": "Hyogo", "country": "Japan", "latitude": 34.6901, "longitude": 135.1955, "elevation": 200},
    {"name": "Vancouver North Shore", "region": "British Columbia", "country": "Canada", "latitude": 49.3200, "longitude": -123.0724, "elevation": 300},
    {"name": "Wellington Hill Suburbs", "region": "Wellington", "country": "New Zealand", "latitude": -41.2865, "longitude": 174.7762, "elevation": 130},
]


def seed_locations(db) -> dict[str, int]:
    name_to_id: dict[str, int] = {}
    for loc in CURATED_LOCATIONS:
        existing = db.query(Location).filter(Location.name == loc["name"]).first()
        if existing:
            name_to_id[loc["name"]] = existing.id
            continue
        row = Location(**loc)
        db.add(row)
        db.commit()
        db.refresh(row)
        name_to_id[loc["name"]] = row.id
        print(f"  + location: {loc['name']}")
    return name_to_id


def seed_landslide_events(db, limit: int = 15000) -> int:
    if not settings.DATASET_PATH.exists():
        print("  ! dataset CSV not found, skipping historical event import")
        return 0

    raw = load_raw_catalog(str(settings.DATASET_PATH))
    clean = clean_catalog(raw)

    inserted = 0
    for _, row in clean.head(limit).iterrows():
        ref = f"GLC:{row.get('event_id')}"
        exists = db.query(LandslideEvent).filter(LandslideEvent.dataset_reference == ref).first()
        if exists:
            continue
        event = LandslideEvent(
            event_date=row.get("event_date") if not str(row.get("event_date")) == "NaT" else None,
            latitude=float(row["latitude"]),
            longitude=float(row["longitude"]),
            severity=str(row.get("landslide_size", "unknown")),
            category=str(row.get("landslide_category", "unknown")),
            trigger=str(row.get("landslide_trigger", "unknown")),
            country=str(row.get("country_name", "unknown")),
            title=str(row.get("event_title", "Landslide event"))[:300],
            fatality_count=None if str(row.get("fatality_count")) == "nan" else float(row.get("fatality_count", 0) or 0),
            source="NASA Global Landslide Catalog",
            dataset_reference=ref,
        )
        db.add(event)
        inserted += 1
        if inserted % 500 == 0:
            db.commit()
            print(f"  ... {inserted} events imported so far")
    db.commit()
    return inserted


def seed_model_runs(db) -> int:
    metadata_path = settings.MODEL_METADATA_PATH
    comparison_path = settings.ARTIFACTS_DIR / "model_comparison.json"
    if not metadata_path.exists() or not comparison_path.exists():
        print("  ! model artifacts not found - run `python train_model.py` first")
        return 0

    metadata = json.loads(metadata_path.read_text())
    comparison = json.loads(comparison_path.read_text())
    selected_name = metadata["selected_model"]
    version = f"{selected_name.replace(' ', '')}_{metadata['trained_at_iso'][:10]}"

    existing = db.query(ModelRun).filter(ModelRun.model_version == version).first()
    if existing:
        print(f"  = model run {version} already registered")
        return 0

    db.query(ModelRun).update({ModelRun.is_active: False})

    inserted = 0
    for name, metrics in comparison.items():
        is_selected = name == selected_name
        v = f"{name.replace(' ', '')}_{metadata['trained_at_iso'][:10]}"
        if db.query(ModelRun).filter(ModelRun.model_version == v).first():
            continue
        run = ModelRun(
            model_name=name,
            model_type="classical_ml",
            model_version=v,
            dataset_name="NASA Global Landslide Catalog + documented pseudo-absence",
            dataset_version=metadata["dataset_version"],
            training_samples=metadata["training_samples"],
            testing_samples=metadata["testing_samples"],
            accuracy=metrics["accuracy"],
            precision=metrics["precision"],
            recall=metrics["recall"],
            f1_score=metrics["f1_score"],
            roc_auc=metrics["roc_auc"],
            is_active=is_selected,
            artifact_path=str(settings.MODEL_PATH) if is_selected else None,
        )
        db.add(run)
        inserted += 1
        print(f"  + model run: {name} (active={is_selected})")
    db.commit()
    return inserted


def main():
    db = SessionLocal()
    try:
        print("Seeding locations...")
        seed_locations(db)
        print("Importing historical landslide events...")
        n = seed_landslide_events(db)
        print(f"  {n} new events imported")
        print("Registering model runs...")
        m = seed_model_runs(db)
        print(f"  {m} new model runs registered")
        print("Done.")
    finally:
        db.close()


if __name__ == "__main__":
    main()