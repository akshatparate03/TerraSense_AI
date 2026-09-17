from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import db_service

router = APIRouter(prefix="/api/models", tags=["models"])


def _serialize(m) -> dict:
    return {
        "id": m.id,
        "model_name": m.model_name,
        "model_type": m.model_type,
        "model_version": m.model_version,
        "training_date": m.training_date.isoformat() if m.training_date else None,
        "dataset_name": m.dataset_name,
        "dataset_version": m.dataset_version,
        "training_samples": m.training_samples,
        "testing_samples": m.testing_samples,
        "accuracy": m.accuracy,
        "precision": m.precision,
        "recall": m.recall,
        "f1_score": m.f1_score,
        "roc_auc": m.roc_auc,
        "is_active": m.is_active,
    }


@router.get("")
async def list_models(db: Session = Depends(get_db)):
    return {"items": [_serialize(m) for m in db_service.list_model_runs(db)]}


@router.get("/latest")
async def latest_model(db: Session = Depends(get_db)):
    m = db_service.get_active_model_run(db)
    if not m:
        raise HTTPException(status_code=404, detail="No active model registered. Run train_model.py then scripts/seed_database.py.")
    return _serialize(m)


@router.get("/{model_id}")
async def get_model(model_id: int, db: Session = Depends(get_db)):
    m = db_service.get_model_run(db, model_id)
    if not m:
        raise HTTPException(status_code=404, detail="Model run not found")
    return _serialize(m)
