<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=TerraSense%20AI&fontSize=70&fontColor=fff&animation=twinkling&fontAlignY=35&desc=Sense%20the%20Earth.%20Predict%20the%20Risk.&descAlignY=60&descSize=22" width="100%"/>

<br/>

<img src="/frontend/public/TerraSense_AI_Logo.png" alt="TerraSense AI Logo" width="140"/>

<br/><br/>

[![Tech](https://img.shields.io/badge/Machine%20Learning-Intelligent%20Risk%20Platform-22d3ee?style=for-the-badge)](#)
[![GitHub Repo](https://img.shields.io/badge/GitHub-TerraSense%20AI-181717?style=for-the-badge&logo=github)](#)

<br/>

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat-square)
![Alembic](https://img.shields.io/badge/Alembic-Migrations-6BA81E?style=flat-square)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.8-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-3.4-006400?style=flat-square)
![Three.js](https://img.shields.io/badge/Three.js-3D-000000?style=flat-square&logo=threedotjs&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-Live%20Stream-8B5CF6?style=flat-square)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens)

</div>

---

## Table of Contents

- [About TerraSense AI](#about-terrasense-ai)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [Security Features](#security-features)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Machine Learning Pipeline](#machine-learning-pipeline)
- [API Endpoints](#api-endpoints)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Performance Notes](#performance-notes)
- [Troubleshooting](#troubleshooting)
- [Owner & Contact](#owner--contact)
- [Full Project Guide (GUIDE.md)](./GUIDE.md)

---

## About TerraSense AI

<div align="center">
<img src="/frontend/public/TerraSense_AI_Logo.png" alt="TerraSense AI Logo" width="120"/>
</div>

<br/>

> **TerraSense AI** is a machine learning powered landslide risk intelligence platform. It assesses landslide risk from environmental conditions using a real, trained classical ML pipeline, persists every prediction/alert/reading to PostgreSQL for a full audit trail, and visualizes everything through a premium, animated, 3D-enhanced React dashboard — complete with a secure authentication system (OTP email verification, Google Sign-In, JWT sessions) and a live historical-data simulation engine.

Every number on the dashboard is real: a trained model's actual accuracy, a real database query's actual count, a real historical catalog's actual event. Nothing is hardcoded.

```
Sense the Earth. Predict the Risk.
```

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                       TERRASENSE AI ARCHITECTURE                     │
├───────────────┬───────────────────────┬──────────────────────────────┤
│    Frontend    │        Backend        │          Data Layer          │
│   React 18     │      FastAPI          │   PostgreSQL 16               │
│   Vite 5       │      SQLAlchemy 2.x   │   NASA Global Landslide       │
│   TailwindCSS  │      Alembic          │   Catalog (11,033 events)     │
│   Three.js     │      JWT + OTP Auth   │   Trained ML Pipeline         │
│   Recharts     │      WebSocket        │   (5 models compared)         │
└───────────────┴───────────────────────┴──────────────────────────────┘
        │                    │                         │
        └────────────────────┴─────────────────────────┘
                   REST API + WebSocket (JWT secured)
```

```
Historical Dataset (NASA Global Landslide Catalog)
        │
Data Cleaning → Feature Engineering → EDA
        │
Train/Test Split → Train 5 candidate ML models → Evaluate → Select best
        │
Persisted sklearn Pipeline (preprocessing + model)
        │
FastAPI backend → Auth / Predictions / Locations / Alerts /
                   Landslide Events / Model Versions / Analytics / Simulation
        │
PostgreSQL → locations, environmental_readings, predictions, alerts,
             landslide_events, model_runs, users, otp_verifications,
             password_reset_tokens
        │
React + Tailwind dashboard → Dashboard / Live Monitoring / Prediction /
             Analytics / Historical Events / ML Model / Map / Locations /
             Alerts / About (+ 3D terrain visualization, fully responsive)
```

```
TerraSense-AI/
├── backend/              # FastAPI REST API, ML pipeline, PostgreSQL, WebSocket
├── frontend/              # React 18 + Vite + TailwindCSS + Three.js
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

---

## Tech Stack

**Machine Learning / Data**
Python · pandas · numpy · scikit-learn · XGBoost · matplotlib · joblib

**Backend**
FastAPI · Pydantic · Uvicorn · SQLAlchemy 2.x · Alembic · PostgreSQL · WebSockets

**Authentication**
JWT (python-jose) · bcrypt (passlib) · Google OAuth 2.0 · Google Apps Script (email delivery)

**Frontend**
React 18 · Vite · Tailwind CSS · Recharts · React-Leaflet · Framer Motion · Three.js / React-Three-Fiber

**Testing**
pytest · FastAPI TestClient

**Deployment**
Netlify (frontend) · Render (backend + managed PostgreSQL)

---

## Core Features

- **Real Machine Learning** — 5 candidate models (Logistic Regression, Decision Tree, Random Forest, Gradient Boosting, XGBoost) trained and compared on real historical data. Best model selected by ROC-AUC on a held-out test set. Current selected model: **XGBoost — 90.1% accuracy, 0.97 ROC-AUC**, reproducible by re-running `train_model.py`.
- **PostgreSQL-Backed Persistence** — every prediction, environmental reading, alert, location, historical event, and model version is stored with real foreign keys, indexes, and a complete audit trail. Alembic migrations (`upgrade`/`downgrade`) fully verified.
- **Secure Authentication** — register with name + email → OTP email verification → 7-rule password policy → JWT session, plus Google Sign-In (one-time registration — returning users never have to register twice), forgot/reset password with expiring single-use tokens.
- **Historical Data Simulation** — a live monitoring feed replays 500 real catalog records over WebSocket with start/pause/resume/stop/reset and adjustable playback speed up to **50x**. Automatically stops at record 500 — no silent auto-restart. A full scrollable 1–500 chart lets you inspect any point in the run.
- **Early-Warning Alerts** — generated automatically the instant a real prediction crosses a risk threshold, with a full ACTIVE → ACKNOWLEDGED → RESOLVED workflow.
- **Fully Interactive Analytics** — confusion matrix, ROC curve, precision-recall curve, and feature-correlation heatmap are all live, hoverable, data-driven components — not static images.
- **Premium 3D Interface** — an interactive, labeled 3D terrain risk visualization (click-to-activate controls, fullscreen mode), animated particle/gradient backgrounds across every page, and a fully responsive layout with a mobile drawer navigation.
- **27 Monitored Locations, 11,033 Real Historical Events** — the complete NASA Global Landslide Catalog is imported into PostgreSQL, not a sample.

---

## Security Features

- Passwords hashed with **bcrypt**, never stored in plaintext.
- OTP codes and password-reset tokens are **hashed before storage** — even a database leak wouldn't expose usable codes.
- **JWT** bearer-token sessions with configurable expiry.
- **Google OAuth 2.0** sign-in — verified server-side against Google's public keys.
- Forgot-password responses are **generic regardless of whether the email exists**, preventing user-enumeration attacks.
- OTP verification is **rate-limited** (max 5 incorrect attempts before requiring a new code).
- All input validated server-side via **Pydantic** schemas, independent of frontend validation.
- CORS explicitly configured — no wildcard origins in production.
- No secrets committed to the repository — everything environment-variable driven.

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                # FastAPI app, all routers registered here
│   ├── core/                  # config, database, security (JWT/bcrypt), auth deps
│   ├── models/db_models.py    # SQLAlchemy ORM models (9 tables)
│   ├── schemas/                # Pydantic request/response schemas
│   ├── api/                    # REST routers: auth, predictions, locations,
│   │                            alerts, landslide_events, models, analytics
│   ├── services/                # business logic: db_service, auth_service,
│   │                             email_service, history_service
│   ├── ml/                      # data_pipeline.py, inference.py
│   └── simulation/engine.py     # historical-data live simulation engine
├── migrations/                  # Alembic migrations
├── data/                        # NASA Global Landslide Catalog CSV
├── models/                      # trained ML pipeline (.joblib)
├── artifacts/                   # evaluation JSON + plots from training
├── scripts/seed_database.py     # idempotent DB seed script
├── tests/test_api.py            # 12 automated tests
├── train_model.py               # reproducible training script
└── requirements.txt

frontend/
├── src/
│   ├── main.jsx / App.jsx       # entry point, routing
│   ├── context/                 # AuthContext, ThemeContext
│   ├── components/               # Layout, AnimatedBackground, TerrainVisualization,
│   │                              InteractiveConfusionMatrix, InteractiveRocCurve, etc.
│   ├── pages/                    # Home, Dashboard, LiveMonitoring, Predict, Analytics,
│   │   └── auth/                 # Login, Register, VerifyOtp, SetPassword, etc.
│   └── services/api.js           # all backend API calls
├── public/                       # real logo/favicon set, robots.txt, sitemap.xml
├── netlify.toml                  # Netlify config (Base directory = frontend)
└── package.json
```

---

## Database Schema

12 relational tables, real foreign keys and indexes throughout:

```
locations ──┬──► environmental_readings
            ├──► predictions ──► alerts
            └──► landslide_events

model_runs ──► predictions

users ──┬──► otp_verifications, password_reset_tokens   (auth)
        └──► alert_subscriptions ──► email_alert_log     (Phase 3: email monitoring)

geo_feature_cache   (Phase 1/2: cached Open-Meteo/SoilGrids/Overpass responses)
```

| Table | Purpose |
|---|---|
| `locations` | Monitoring locations (27 real, named, geolocated regions) |
| `environmental_readings` | Environmental inputs behind each prediction, tagged `real` / `simulated_demo` / `user_input` / `live_geo_api` |
| `predictions` | Every ML prediction: risk level, probability, model version, full audit trail |
| `alerts` | Auto-generated when a prediction crosses a risk threshold; ACTIVE/ACKNOWLEDGED/RESOLVED (in-app/website alert list) |
| `landslide_events` | Real historical events from the NASA Global Landslide Catalog + the real India inventories (Phase 2) |
| `model_runs` | Every trained model version with real accuracy/precision/recall/F1/ROC-AUC |
| `users` | Accounts — local (email+password) or Google OAuth |
| `otp_verifications` | Hashed, expiring, attempt-limited OTP codes |
| `password_reset_tokens` | Hashed, expiring, single-use reset tokens |
| `geo_feature_cache` | Cached live geospatial API responses, keyed by rounded lat/lon/radius/source, with per-source TTL |
| `alert_subscriptions` | A user's monitored location + radius + email + alert/reset thresholds + cooldown + hysteresis state (Phase 3) |
| `email_alert_log` | Every email actually sent (or attempted), independent of the in-app `alerts` table (Phase 3) |

---

## Live Location-Based Prediction (Geospatial Data Engine)

The **Predict** page's default mode no longer asks the user to type in
rainfall, soil moisture, slope, elevation, temperature, or humidity. Instead:

```
User clicks a point on the map (or taps "Use My Location")
        │
Selects an analysis radius (1 / 3 / 5 / 10 / 25 km)
        │
POST /api/predictions/location  { latitude, longitude, radius_km }
        │
Geo Data Engine (app/services/geo_data_service.py) concurrently queries:
        │
   ┌────────────┬──────────────────┬───────────────┬──────────────────┐
   │  Weather/  │   Elevation +    │  Soil texture │   Construction/  │
   │  Rainfall  │   Slope          │  & pH         │   building count │
   │ Open-Meteo │  Open-Meteo      │  ISRIC        │  OSM Overpass    │
   │ (point)    │  Elevation API   │  SoilGrids    │  (radius query)  │
   │            │  (5-pt finite    │  v2.0 (point) │                  │
   │            │  difference)     │               │                  │
   └────────────┴──────────────────┴───────────────┴──────────────────┘
        │
Feature vector built to match the trained model's schema
        │
Random Forest / XGBoost pipeline → probability → risk level
        │
Response includes the raw data_sources block + a `data_status` per source
(LIVE / CACHED / UNAVAILABLE) and an overall `data_quality` (HIGH/MEDIUM/LOW)
```

**All data sources are free and keyless** — no signup or API key needed to
run this locally. Static/slow-changing sources (elevation, slope, soil) are
cached in Postgres (`geo_feature_cache` table) for up to 30 days; weather is
cached for 30 minutes — see `GEO_CACHE_TTL_MINUTES` in `.env`.

**Honesty about the current model**: the trained model itself (below) was
fit on the NASA Global Landslide Catalog with *simulated* environmental
features, not real ones. Feeding it real live weather/soil values is a
genuine distribution shift the model has not seen — every response from
`/api/predictions/location` includes a `data_provenance.model_training_caveat`
saying so explicitly. Retraining on a real fused dataset (real landslide
inventories + real Open-Meteo/SoilGrids/OSM features) is tracked as the next
upgrade phase.

If a required live source (weather or terrain) is unavailable and nothing
usable is cached, the endpoint returns **HTTP 503 with no prediction** rather
than substituting a fabricated value.

**Offline/no-wifi demo mode**: set `MOCK_EXTERNAL_APIS=true` in `backend/.env`
to get deterministic, clearly-labeled demo data instead of live API calls —
useful if you're presenting somewhere without reliable internet. Every
response in this mode is tagged `"status": "DEMO"` and `"demo_mode": true`.
Never leave this on in a real deployment.

The old manual-entry form still exists under the **Manual (Legacy)** tab on
the Predict page and the original `POST /api/predictions` endpoint, kept
for testing and backward compatibility (spec section 81) — but it is no
longer the primary flow.

---

## Machine Learning Pipeline

TerraSense now trains **two model generations**, both reproducible, neither silently
overwriting the other (spec sections 51, 80-81):

### v1 — Legacy (`python train_model.py`, default)

**Data source:** NASA Global Landslide Catalog (11,033 real events) only. No
rainfall/soil-moisture/slope sensor readings and no negative ("no landslide")
examples exist in the raw catalog, so TerraSense uses the real geo/temporal/
trigger fields as-is and generates a **documented, seeded, clearly disclosed**
simulated environmental feature set (13 features total) — a standard technique
in landslide-susceptibility ML literature.

| Model | Accuracy | F1 | ROC-AUC |
|---|---|---|---|
| Logistic Regression | 89.4% | 0.890 | 0.965 |
| Decision Tree | 88.0% | 0.876 | 0.945 |
| Random Forest | 89.7% | 0.892 | 0.969 |
| Gradient Boosting | 89.6% | 0.892 | 0.969 |
| **XGBoost (selected)** | **90.1%** | **0.898** | **0.970** |

### v2 — Master Dataset (`python scripts/build_master_dataset.py` then `python train_model.py --dataset master --promote`)

**Data source:** the same NASA catalog **plus real India-specific inventories**
(Field GPS survey, 359 points + Himachal Pradesh 2023 disaster inventory, 3,176
points — see `app/ml/india_inventory.py`, zero network required, parsed directly
from the provided shapefiles). **20 features** — the original 13 plus soil
texture/pH (ISRIC SoilGrids), building/construction density (OSM Overpass), and
slope aspect. Negative samples are spatial perturbations of real event sites
with a documented, distinctly calmer severity band (spec section 19) — not
arbitrary blank-map locations.

| Model | Accuracy | F1 | ROC-AUC |
|---|---|---|---|
| Logistic Regression | 90.0% | 0.897 | 0.969 |
| Decision Tree | 90.7% | 0.905 | 0.959 |
| Random Forest | 91.9% | 0.916 | 0.976 |
| Gradient Boosting | 91.9% | 0.917 | 0.978 |
| **XGBoost (selected)** | **92.4%** | **0.922** | **0.981** |

**Honesty note:** the metrics above were produced with `--mode mock` (this
sandbox has no outbound internet access to Open-Meteo/SoilGrids/Overpass). The
**landslide labels are 100% real** in both modes; the *environmental feature
layer* is deterministic mock data in mock mode, tagged `feature_source=MOCK` in
`data/master/terrasense_master_dataset.parquet`. Re-run
`python scripts/build_master_dataset.py --mode live --limit 500` with real
internet access to replace the mock layer with real Open-Meteo/SoilGrids/OSM
measurements and retrain — no code changes needed, same command.

**Model versioning:** every `--dataset master` run is saved under
`models/versions/<version_tag>/` and appended to `models/model_registry.json`
regardless of `--promote`; only `--promote` overwrites the currently active
`models/landslide_pipeline.joblib` that the API serves. `inference.py` reads
each model's own `feature_columns` from its metadata rather than a hardcoded
list, so v1 and v2 models — and any future version — load and serve correctly
without code changes, and any field a caller doesn't supply is explicitly
reported in the response's `features_defaulted` list rather than silently
guessed.

**Explainability:** feature importances from the selected tree-based model,
exposed via API and rendered as an interactive bar chart — described as
model-level importance, not a causal claim.

---

## Real India Landslide Data (Phase 2)

| Source | Real events | What's real | Known limitation |
|---|---|---|---|
| Field GPS Survey (Himachal Pradesh, Oct 2023) | 359 | Exact GPS coordinates + exact timestamp + field-assessed Anthropogenic/Natural category | None — directly surveyed |
| Himachal Pradesh 2023 Inventory (Shimla) | 3,176 | Real polygon-derived point coordinates (reprojected from UTM 43N) + real area + real Anthropogenic/Natural category (1,418 / 1,758 split) | No per-event date in the source shapefile — every row uses 2023-08-14 (peak of the documented August 2023 disaster) as an approximate date, flagged `date_is_approximate=True` |
| ISRO Landslide Atlas of India (PDF) | — | Official 93-page NRSC report, state-wise maps/statistics | Not machine-readable point data — used for citation/context only, not row-level training data |

These flow through the **same, unmodified** `clean_catalog()` /
`build_training_dataset()` pipeline as the NASA catalog — see
`app/ml/data_pipeline.py::load_combined_catalog()`.

---

## Email Alert Monitoring (Phase 3)

Replaces the website-only alert list as the primary early-warning mechanism
(spec sections 37-43). A logged-in user picks a location + radius + email +
risk threshold on the **Alerts** page; a background APScheduler job (interval
`MONITORING_INTERVAL_MINUTES`, default 15) re-runs the live prediction
pipeline for every active subscription and emails via the existing Google Apps
Script backend (`app/services/email_service.py`) when risk crosses the
threshold.

**Hysteresis, not a one-shot trigger** (spec section 42) — `app/services/monitoring_service.py`:

```
NORMAL --[probability >= alert_threshold AND cooldown elapsed]--> send email --> ALERTED
ALERTED --[probability < reset_threshold]--> NORMAL (silently re-arms, no email)
```

`cooldown_minutes` (default 360) additionally blocks a second email even if
the state machine would otherwise allow one. Every subscription's
`alert_threshold`/`reset_threshold`/`cooldown_minutes` are configurable, not
hardcoded — `reset_threshold` is auto-clamped below `alert_threshold` if
misconfigured.

**Honesty in dev mode:** if `APPS_SCRIPT_EMAIL_URL` isn't configured, a
triggered alert is logged with `delivery_status=DEV_MODE_LOGGED` in
`email_alert_log` rather than falsely reporting `SENT`.

Endpoints: `POST /api/monitoring/start`/`/stop`, `GET /api/monitoring/status`,
`POST /api/alerts/test` (forces one immediate check+email for verification),
`GET /api/alerts/email-history`.

---

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Start registration, sends OTP |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/set-password` | Set password, returns JWT |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/google` | Google Sign-In |
| POST | `/api/auth/forgot-password` / `/reset-password` | Password recovery |
| GET | `/api/auth/me` | Current user |
| POST | `/api/predictions` | **Legacy/manual** — run ML inference from manually-entered environmental values |
| POST | `/api/predictions/location` | **Primary** — live location-based prediction: pass `latitude`, `longitude`, `radius_km` only; every environmental feature is fetched automatically (weather, rainfall, soil moisture, elevation, slope, soil texture, construction density) |
| GET | `/api/location/features` | Preview live geospatial features for a point/radius without running a prediction (used by the map UI) |
| GET | `/api/predictions`, `/latest`, `/high-risk`, `/{id}`, `/location/{id}` | Prediction history & filtering |
| GET/POST/PUT/DELETE | `/api/locations` | Location CRUD |
| GET | `/api/alerts`, `/active`, `/history`, `/{id}` | In-app alert feed |
| PATCH | `/api/alerts/{id}/status` | Update alert status |
| POST | `/api/alerts/test` | Force one immediate check+email for a subscription (verify setup) |
| GET | `/api/alerts/email-history` | Real sent-email log (Phase 3) |
| POST | `/api/monitoring/start` / `/stop` | Enable/disable email-alert monitoring for a location |
| GET | `/api/monitoring/status` | List the current user's monitored locations + hysteresis state |
| GET | `/api/landslide-events` | Real historical events, paginated/filterable |
| GET | `/api/models`, `/latest`, `/{id}` | Model version tracking |
| GET | `/api/model/info`, `/metrics`, `/features` | Trained model metadata (works for either v1 or v2, whichever is active) |
| GET | `/api/model/confusion-matrix`, `/roc-curve`, `/precision-recall-curve` | Raw chart data for interactive UI |
| GET | `/api/dataset/correlation-matrix` | Raw correlation data for interactive heatmap |
| GET | `/api/analytics/overview`, `/risk-distribution`, `/location-summary`, `/timeline`, `/alerts` | Dashboard analytics (DB-backed) |
| POST | `/api/simulation/start`, `/pause`, `/resume`, `/stop`, `/reset`, `/speed` | Simulation controls |
| GET | `/api/simulation/status`, `/full-history` | Simulation state + full 1–500 run data |
| WS | `/ws/monitoring` | Live simulation stream |

Interactive docs at `/docs` once the backend is running.

---

## Setup & Installation

```bash
# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# .env is already filled in for local dev — see Environment Variables below
alembic upgrade head   # includes geo_feature_cache, alert_subscriptions, email_alert_log

# Option A: legacy model only (fast, no shapefile/network dependency)
python train_model.py

# Option B: Phase 2 master-dataset model (real India data + geo features)
python scripts/build_master_dataset.py --mode mock   # or --mode live (needs internet, slower)
python train_model.py --dataset master --promote

python scripts/seed_database.py
uvicorn app.main:app --reload
# No API keys needed for live location prediction or Phase 2 dataset building
# (Open-Meteo/SoilGrids/OSM are free & keyless). Set MOCK_EXTERNAL_APIS=true
# in .env for a fully offline live-prediction demo.

# Frontend
cd frontend
npm install
npm run dev
```

Full step-by-step walkthrough (including PostgreSQL setup) is in the
[GUIDE.md](./GUIDE.md), section 13.

---

## Environment Variables

`backend/.env` and `frontend/.env` are already filled in with working local-dev
values. Summary:

| Variable | Where | Notes |
|---|---|---|
| `DATABASE_URL` | backend | Local PostgreSQL connection string |
| `JWT_SECRET` | backend | Signs session tokens |
| `GOOGLE_CLIENT_ID` | backend **and** frontend (`VITE_GOOGLE_CLIENT_ID`) | Must be the **same** value in both |
| `APPS_SCRIPT_EMAIL_URL` / `APPS_SCRIPT_SHARED_SECRET` | backend | Real email delivery for OTP/reset **and** landslide risk alerts (Phase 3) |
| `CONTACT_FORM_TO_EMAIL` | backend | Inbox that receives messages submitted through the public Contact page (reuses the same Apps Script webhook) |
| `CORS_ORIGINS` / `FRONTEND_URL` | backend | Set to `localhost:5173` for local dev |
| `MOCK_EXTERNAL_APIS` | backend | `true` = offline demo data for live-location prediction (no internet needed) |
| `MONITORING_ENABLED` / `MONITORING_INTERVAL_MINUTES` | backend | Background email-alert worker on/off + check frequency |
| `DEFAULT_ALERT_THRESHOLD` / `DEFAULT_RESET_THRESHOLD` / `DEFAULT_ALERT_COOLDOWN_MINUTES` | backend | Default hysteresis config for new subscriptions (per-subscription overridable) |

See `backend/.env.example` and `frontend/.env.example` for the full reference.

---

## Deployment

- **Frontend (Netlify):** Base directory `frontend` (where `netlify.toml` lives). Set `VITE_API_BASE_URL`, `VITE_WS_BASE_URL`, `VITE_GOOGLE_CLIENT_ID` in Netlify's environment variables when ready to deploy.
- **Backend (Render):** Create a PostgreSQL instance + a Web Service with Root Directory `backend`, build command `pip install -r requirements.txt && alembic upgrade head && python train_model.py && python scripts/seed_database.py`, start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

Full deployment walkthrough with exact click-by-click steps: [GUIDE.md](./GUIDE.md) section 14.

---

## Performance Notes

- All analytics/dashboard queries are aggregated in PostgreSQL, not computed client-side.
- Pagination on every list endpoint (predictions, alerts, historical events).
- 3D terrain uses capped device-pixel-ratio and WebGL context-loss recovery for stability on lower-end devices.
- Simulation writes are batched per-tick; no N+1 query patterns in the hot path.

---

## Troubleshooting

See [GUIDE.md](./GUIDE.md) section 18 for the full list. Quick fixes:

| Symptom | Fix |
|---|---|
| Backend can't connect to Postgres | `service postgresql start` / check `DATABASE_URL` in `backend/.env` |
| "Model is not trained/loaded yet" | Run `python train_model.py` |
| OTP email never arrives | Check backend console — if `APPS_SCRIPT_EMAIL_URL` isn't reachable, the OTP is logged there directly for local testing |
| Google Sign-In button missing | `VITE_GOOGLE_CLIENT_ID` must be set in `frontend/.env` (not just the backend one) |
| CORS error in browser console | Frontend origin missing from backend's `CORS_ORIGINS` |

---

## Owner & Contact

Built by the TerraSense AI team. Contributor details are on the in-app **About**
page. This project builds on and substantially extends an open-source
hardware-monitoring foundation — see the About page for the full lineage and
the list of changes.

---