from __future__ import annotations

import asyncio
import logging

from fastapi import Depends, FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.api import alerts, analytics_api, global_scan, health, landslide_events, locations, models_api, monitoring, predictions
from app.api.auth import router as auth_router
from app.core.config import settings
from app.core.database import SessionLocal, get_db
from app.ml.inference import inference_service
from app.services import db_service, global_scan_service, history_service, monitoring_service
from app.simulation.engine import simulation_engine

logging.basicConfig(level=settings.LOG_LEVEL, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("terrasense_api")

app = FastAPI(
    title=f"{settings.APP_NAME} API",
    description=(
        f"{settings.APP_NAME} — Machine Learning Based Intelligent Landslide Risk Assessment "
        f"and Early Warning System. \"{settings.APP_TAGLINE}\" "
        "Software-based risk intelligence platform - not a certified emergency-warning service."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    app.mount("/artifacts", StaticFiles(directory=str(settings.ARTIFACTS_DIR)), name="artifacts")
except Exception:
    logger.warning("Artifacts directory not found yet - run train_model.py")

# Routers
app.include_router(auth_router)
app.include_router(health.router)
app.include_router(predictions.router)
app.include_router(predictions.location_router)
app.include_router(locations.router)
app.include_router(alerts.router)
app.include_router(monitoring.router)
app.include_router(global_scan.router)
app.include_router(landslide_events.router)
app.include_router(models_api.router)
app.include_router(analytics_api.router)


# ---------------------------------------------------------------------------
# Health & branding are handled by app/api/health.py (registered above as
# health.router) -- JSON at /api/health/status, styled status page at
# /api/health (good uptime-pinger target for keeping a free Render instance
# awake).
# ---------------------------------------------------------------------------
# Model info / metrics (from trained artifacts - kept for the ML Model page's
# confusion matrix / ROC / feature-importance visuals; DB-backed version-
# tracking lives under /api/models)
# ---------------------------------------------------------------------------
@app.get("/api/model/info")
async def model_info():
    return inference_service.get_info()


@app.get("/api/model/metrics")
async def model_metrics():
    return inference_service.get_metrics()


@app.get("/api/model/features")
async def model_features():
    return {"feature_importance": inference_service.get_feature_importance()}


@app.get("/api/model/confusion-matrix")
async def model_confusion_matrix():
    return inference_service.get_confusion_matrix()


@app.get("/api/model/roc-curve")
async def model_roc_curve():
    return inference_service.get_roc_curve()


@app.get("/api/model/precision-recall-curve")
async def model_precision_recall_curve():
    return inference_service.get_precision_recall_curve()


@app.get("/api/dataset/correlation-matrix")
async def dataset_correlation_matrix():
    return inference_service.get_correlation_matrix()


# ---------------------------------------------------------------------------
# Dashboard summary (DB-backed)
# ---------------------------------------------------------------------------
@app.get("/api/dashboard/summary")
async def dashboard_summary(db: Session = Depends(get_db)):
    from app.services import db_service

    return db_service.analytics_overview(db)


# ---------------------------------------------------------------------------
# Dataset-wide EDA endpoints (read directly from the source CSV catalog - used
# by the Analytics page for descriptive statistics over the FULL catalog,
# independent of how many events have been imported into PostgreSQL)
# ---------------------------------------------------------------------------
@app.get("/api/dataset/historical")
async def dataset_historical(
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    country: str | None = None,
    category: str | None = None,
    search: str | None = None,
):
    return history_service.get_historical_events(
        limit=limit, offset=offset, country=country, category=category, search=search
    )


@app.get("/api/dataset/analytics")
async def dataset_analytics():
    return history_service.get_analytics()


@app.get("/api/dataset/locations")
async def dataset_locations(limit: int = Query(300, le=1000)):
    return {"locations": history_service.get_locations(limit=limit)}


# ---------------------------------------------------------------------------
# Simulation controls
# ---------------------------------------------------------------------------
@app.post("/api/simulation/start")
async def simulation_start(speed: float = Query(1.0, ge=0.25, le=50)):
    return simulation_engine.start(speed=speed)


@app.post("/api/simulation/pause")
async def simulation_pause():
    return simulation_engine.pause()


@app.post("/api/simulation/resume")
async def simulation_resume():
    return simulation_engine.resume()


@app.post("/api/simulation/stop")
async def simulation_stop():
    return simulation_engine.stop()


@app.post("/api/simulation/reset")
async def simulation_reset():
    return simulation_engine.reset()


@app.post("/api/simulation/speed")
async def simulation_speed(speed: float = Query(..., ge=0.25, le=50)):
    return simulation_engine.set_speed(speed)


@app.get("/api/simulation/status")
async def simulation_status():
    return simulation_engine.status()


@app.get("/api/simulation/full-history")
async def simulation_full_history():
    """All 500 simulation records (index 1..500) with their ML predictions, for
    the scrollable full-run chart where the user can hover across the entire
    run to inspect rainfall / soil moisture / probability at any point."""
    return {"items": simulation_engine.get_full_history(), "total_records": simulation_engine.total_records}


# ---------------------------------------------------------------------------
# WebSocket monitoring stream
# ---------------------------------------------------------------------------
@app.websocket("/ws/monitoring")
async def ws_monitoring(websocket: WebSocket):
    await websocket.accept()
    queue = simulation_engine.subscribe()
    try:
        while True:
            message = await queue.get()
            await websocket.send_json(message)
    except WebSocketDisconnect:
        logger.info("Client disconnected from /ws/monitoring")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        simulation_engine.unsubscribe(queue)


@app.websocket("/ws/live-scan")
async def ws_live_scan(websocket: WebSocket):
    """Streams each watchlist location's REAL result as it completes, for
    the Live Global Scan page (app/services/global_scan_service.py). Client
    sends any message to trigger one scan pass; server streams
    {"type": "location_result", ...} per location, then
    {"type": "scan_complete", "results": [...]}."""
    await websocket.accept()
    try:
        while True:
            await websocket.receive_text()  # any message triggers a scan
            db = SessionLocal()
            try:
                locations = db_service.list_locations(db, active_only=True)
                await websocket.send_json({"type": "scan_started", "total": len(locations)})
                results = []
                for loc in locations:
                    r = await global_scan_service.scan_one_location(db, loc)
                    results.append(r)
                    await websocket.send_json({"type": "location_result", **r})
                    await asyncio.sleep(0.05)
                results.sort(key=lambda r: r.get("probability") if r.get("probability") is not None else -1, reverse=True)
                await websocket.send_json({"type": "scan_complete", "results": results})
            finally:
                db.close()
    except WebSocketDisconnect:
        logger.info("Client disconnected from /ws/live-scan")
    except Exception as e:  # noqa: BLE001
        logger.error(f"Live scan websocket error: {e}")


# ---------------------------------------------------------------------------
# Background monitoring worker (spec section 43): periodically re-checks
# every active email-alert subscription and sends alerts as needed. Uses
# APScheduler -- deliberately not Celery/Kafka, per spec section 43's own
# guidance to keep this a college-project-appropriate architecture. Disable
# entirely via MONITORING_ENABLED=false in .env (e.g. during tests).
# ---------------------------------------------------------------------------
scheduler: "AsyncIOScheduler | None" = None


async def _run_monitoring_job():
    db = SessionLocal()
    try:
        await monitoring_service.run_monitoring_cycle(db)
    except Exception as e:  # noqa: BLE001
        logger.error(f"Scheduled monitoring cycle failed: {e}")
    finally:
        db.close()


@app.on_event("startup")
async def _start_scheduler():
    global scheduler
    if not settings.MONITORING_ENABLED:
        logger.info("Monitoring scheduler disabled via MONITORING_ENABLED=false")
        return
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler

        scheduler = AsyncIOScheduler()
        scheduler.add_job(
            _run_monitoring_job,
            "interval",
            minutes=settings.MONITORING_INTERVAL_MINUTES,
            id="landslide_monitoring_cycle",
            next_run_time=None,  # first run happens one interval from now, not immediately at boot
        )
        scheduler.start()
        logger.info(f"Monitoring scheduler started: checking every {settings.MONITORING_INTERVAL_MINUTES} minutes")
    except Exception as e:  # noqa: BLE001
        logger.error(f"Failed to start monitoring scheduler: {e}")


@app.on_event("shutdown")
async def _stop_scheduler():
    if scheduler is not None:
        scheduler.shutdown(wait=False)