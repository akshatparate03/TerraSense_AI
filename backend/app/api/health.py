from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.ml.inference import inference_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/health", tags=["health"])


def _check_database(db: Session) -> bool:
    try:
        db.execute(text("SELECT 1"))
        return True
    except Exception as e:  # pragma: no cover
        logger.error(f"DB health check failed: {e}")
        return False


@router.get("/status")
async def health_status(db: Session = Depends(get_db)):
    db_ok = _check_database(db)
    model_ok = inference_service.is_ready
    google_ok = bool(settings.GOOGLE_CLIENT_ID)
    overall = "UP" if (db_ok and model_ok) else "DEGRADED"
    return {
        "status": overall,
        "backend": "UP",
        "database": "UP" if db_ok else "DOWN",
        "mlModel": "LOADED" if model_ok else "NOT_LOADED",
        "googleOAuth": "CONFIGURED" if google_ok else "NOT_CONFIGURED",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
    }


# HTML page lives at the bare "/api/health" (same pattern as the Java
# reference controllers: GetMapping("/status") for JSON, GetMapping("")
# for the styled status page) -- this is the URL to hit with an uptime
# pinger (e.g. UptimeRobot / cron-job.org) to keep a free Render instance
# from cold-starting.
@router.get("", response_class=HTMLResponse)
async def health_page(db: Session = Depends(get_db)):
    db_ok = _check_database(db)
    model_ok = inference_service.is_ready
    google_ok = bool(settings.GOOGLE_CLIENT_ID)
    now = datetime.now().strftime("%d %b %Y, %I:%M:%S %p")
    all_up = db_ok and model_ok

    html = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>TerraSense AI — Backend Status</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@700;800&family=Inter:wght@300;400;500&display=swap" rel="stylesheet"/>
          <style>
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            html, body { min-height: 100vh; background: #05070a; font-family: 'Inter', sans-serif; color: #e2e8f0; overflow-x: hidden; }
            .orb { position: fixed; border-radius: 50%; filter: blur(100px); opacity: 0.16; pointer-events: none; animation: floatOrb 14s ease-in-out infinite alternate; }
            .orb-1 { width: 520px; height: 520px; background: radial-gradient(circle,#22d3ee,#3b82f6); top: -150px; left: -120px; }
            .orb-2 { width: 440px; height: 440px; background: radial-gradient(circle,#34d399,#22d3ee); bottom: -100px; right: -100px; animation-direction: alternate-reverse; animation-duration: 10s; }
            @keyframes floatOrb { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(40px,30px) scale(1.07)} }
            .grid-bg { position: fixed; inset: 0; pointer-events: none; background-image: linear-gradient(rgba(34,211,238,0.04) 1px,transparent 1px), linear-gradient(90deg,rgba(34,211,238,0.04) 1px,transparent 1px); background-size: 48px 48px; }
            .page { position: relative; z-index: 1; max-width: 680px; margin: 0 auto; padding: 3rem 1.5rem 4rem; display: flex; flex-direction: column; align-items: center; gap: 2rem; }
            .logo-wrap { display: flex; align-items: center; gap: 0.85rem; animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
            .logo-icon { width: 56px; height: 56px; border-radius: 16px; background: rgba(34,211,238,0.15); border: 1px solid rgba(34,211,238,0.3); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 24px rgba(34,211,238,0.2); font-size: 1.6rem; }
            .brand { font-family: 'Inter', sans-serif; font-size: 1.8rem; font-weight: 800; background: linear-gradient(135deg,#22d3ee,#3b82f6,#34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -0.02em; }
            .sub { font-size: 0.8rem; color: rgba(255,255,255,0.3); letter-spacing: 0.1em; text-transform: uppercase; }
            .overall-badge { display: inline-flex; align-items: center; gap: 0.6rem; padding: 0.6rem 1.4rem; border-radius: 100px; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.9rem; letter-spacing: 0.04em; animation: fadeUp 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both; }
            .overall-badge.up   { background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.3); color: #4ade80; }
            .overall-badge.down { background: rgba(244,63,94,0.12); border: 1px solid rgba(244,63,94,0.3); color: #f87171; }
            .pulse { width: 9px; height: 9px; border-radius: 50%; background: currentColor; animation: pulse 1.5s ease infinite; }
            @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
            .cards { width: 100%; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr)); gap: 1rem; animation: fadeUp 0.5s 0.15s cubic-bezier(0.16,1,0.3,1) both; }
            .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 1.4rem 1.5rem; display: flex; flex-direction: column; gap: 0.9rem; transition: border-color 0.2s, transform 0.2s; position: relative; overflow: hidden; }
            .card:hover { border-color: rgba(34,211,238,0.25); transform: translateY(-2px); }
            .card::before { content: ''; position: absolute; top: 0; left: 10%; right: 10%; height: 1px; background: linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent); }
            .card-header { display: flex; align-items: center; justify-content: space-between; }
            .card-icon-label { display: flex; align-items: center; gap: 0.65rem; }
            .card-icon { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
            .card-label { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.95rem; color: #fff; }
            .status-pill { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.75rem; border-radius: 100px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
            .status-pill.up   { background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.25); color: #4ade80; }
            .status-pill.down { background: rgba(244,63,94,0.12); border: 1px solid rgba(244,63,94,0.25); color: #f87171; }
            .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
            .card-detail { font-size: 0.8rem; color: rgba(255,255,255,0.3); line-height: 1.5; }
            .card-detail span { color: rgba(255,255,255,0.55); }
            .timestamp { font-size: 0.75rem; color: rgba(255,255,255,0.22); animation: fadeUp 0.5s 0.3s cubic-bezier(0.16,1,0.3,1) both; }
            .timestamp span { color: rgba(255,255,255,0.4); }
            .links { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; animation: fadeUp 0.5s 0.35s cubic-bezier(0.16,1,0.3,1) both; }
            .links a { font-size: 0.78rem; color: rgba(34,211,238,0.75); text-decoration: none; padding: 0.35rem 0.8rem; border-radius: 8px; border: 1px solid rgba(34,211,238,0.2); transition: all 0.2s; }
            .links a:hover { background: rgba(34,211,238,0.1); color: #67e8f9; border-color: rgba(34,211,238,0.4); }
            @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
            @media(max-width:480px) { .page { padding: 2rem 1rem 3rem; } .brand { font-size: 1.5rem; } }
          </style>
        </head>
        <body>
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
          <div class="grid-bg"></div>
          <div class="page">

            <div class="logo-wrap">
              <div class="logo-icon">&#9968;&#65039;</div>
              <div>
                <div class="brand">TerraSense AI</div>
                <div class="sub">Backend Health Status</div>
              </div>
            </div>

            <div class="overall-badge %OVERALL_CLASS%">
              <span class="pulse"></span>
              All Systems %OVERALL_TEXT%
            </div>

            <div class="cards">

              <!-- Backend -->
              <div class="card">
                <div class="card-header">
                  <div class="card-icon-label">
                    <div class="card-icon" style="background:rgba(34,211,238,0.12);border:1px solid rgba(34,211,238,0.25)">&#9881;&#65039;</div>
                    <div class="card-label">Backend Server</div>
                  </div>
                  <div class="status-pill up"><span class="dot"></span> Running</div>
                </div>
                <div class="card-detail">
                  Framework: <span>FastAPI</span><br/>
                  Runtime: <span>Python 3.12</span><br/>
                  Server: <span>Uvicorn</span><br/>
                  Base Path: <span>/api</span>
                </div>
              </div>

              <!-- PostgreSQL -->
              <div class="card">
                <div class="card-header">
                  <div class="card-icon-label">
                    <div class="card-icon" style="background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.25)">&#128452;&#65039;</div>
                    <div class="card-label">PostgreSQL Database</div>
                  </div>
                  <div class="status-pill %DB_CLASS%"><span class="dot"></span> %DB_TEXT%</div>
                </div>
                <div class="card-detail">
                  ORM: <span>SQLAlchemy 2.x</span><br/>
                  Migrations: <span>Alembic</span><br/>
                  Connection: <span>%DB_CONN%</span>
                </div>
              </div>

              <!-- ML Model -->
              <div class="card">
                <div class="card-header">
                  <div class="card-icon-label">
                    <div class="card-icon" style="background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.25)">&#129504;</div>
                    <div class="card-label">ML Model</div>
                  </div>
                  <div class="status-pill %MODEL_CLASS%"><span class="dot"></span> %MODEL_TEXT%</div>
                </div>
                <div class="card-detail">
                  Selected: <span>%MODEL_NAME%</span><br/>
                  Library: <span>scikit-learn / XGBoost</span><br/>
                  Artifact: <span>%MODEL_CONN%</span>
                </div>
              </div>

              <!-- Google OAuth -->
              <div class="card">
                <div class="card-header">
                  <div class="card-icon-label">
                    <div class="card-icon" style="background:rgba(234,67,53,0.12);border:1px solid rgba(234,67,53,0.25)">&#128273;</div>
                    <div class="card-label">Google OAuth2</div>
                  </div>
                  <div class="status-pill %GOOGLE_CLASS%"><span class="dot"></span> %GOOGLE_TEXT%</div>
                </div>
                <div class="card-detail">
                  Flow: <span>One-Tap / Popup (ID Token)</span><br/>
                  Endpoint: <span>/api/auth/google</span>
                </div>
              </div>

            </div>

            <div class="timestamp">Last checked: <span>%TIMESTAMP%</span></div>

            <div class="links">
              <a href="/api/health/status">&#128202; JSON Status</a>
              <a href="/docs">&#128220; API Docs</a>
              <a href="%FRONTEND_URL%" target="_blank">&#127760; Frontend</a>
            </div>

          </div>
        </body>
        </html>
        """

    model_name = inference_service.metadata.get("selected_model", "not trained yet") if model_ok else "not loaded"

    html = (
        html.replace("%OVERALL_CLASS%", "up" if all_up else "down")
        .replace("%OVERALL_TEXT%", "Operational &#10003;" if all_up else "Degraded &#9888;")
        .replace("%DB_CLASS%", "up" if db_ok else "down")
        .replace("%DB_TEXT%", "Connected" if db_ok else "Down")
        .replace("%DB_CONN%", "Active" if db_ok else "Failed — check DATABASE_URL")
        .replace("%MODEL_CLASS%", "up" if model_ok else "down")
        .replace("%MODEL_TEXT%", "Loaded" if model_ok else "Not Loaded")
        .replace("%MODEL_NAME%", model_name)
        .replace("%MODEL_CONN%", "landslide_pipeline.joblib" if model_ok else "run train_model.py")
        .replace("%GOOGLE_CLASS%", "up" if google_ok else "down")
        .replace("%GOOGLE_TEXT%", "Configured" if google_ok else "Missing")
        .replace("%FRONTEND_URL%", settings.FRONTEND_URL)
        .replace("%TIMESTAMP%", now)
    )

    return HTMLResponse(content=html)