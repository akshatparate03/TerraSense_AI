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

9 relational tables, real foreign keys and indexes throughout:

```
locations ──┬──► environmental_readings
            ├──► predictions ──► alerts
            └──► landslide_events

model_runs ──► predictions

users, otp_verifications, password_reset_tokens   (auth)
```

| Table | Purpose |
|---|---|
| `locations` | Monitoring locations (27 real, named, geolocated regions) |
| `environmental_readings` | Environmental inputs behind each prediction, tagged `real` / `simulated_demo` / `user_input` |
| `predictions` | Every ML prediction: risk level, probability, model version, full audit trail |
| `alerts` | Auto-generated when a prediction crosses a risk threshold; ACTIVE/ACKNOWLEDGED/RESOLVED |
| `landslide_events` | All 11,033 real historical events from the NASA Global Landslide Catalog |
| `model_runs` | Every trained model version with real accuracy/precision/recall/F1/ROC-AUC |
| `users` | Accounts — local (email+password) or Google OAuth |
| `otp_verifications` | Hashed, expiring, attempt-limited OTP codes |
| `password_reset_tokens` | Hashed, expiring, single-use reset tokens |

---

## Machine Learning Pipeline

**Data source:** NASA Global Landslide Catalog (11,033 real events). This catalog
records real events only — no rainfall/soil-moisture/slope sensor readings and no
negative ("no landslide") examples exist in it. TerraSense AI uses the real
geo/temporal/trigger fields as-is, and generates a **documented, seeded, clearly
disclosed** simulated environmental feature set (rainfall, soil moisture, slope,
elevation, temperature, humidity) plus pseudo-absence negative samples — a standard
technique in landslide-susceptibility ML literature — to train a genuine two-class
classifier. Every prediction response includes a `data_provenance` block naming
exactly which fields are real vs. simulated.

**Models evaluated:** Logistic Regression, Decision Tree, Random Forest, Gradient
Boosting, XGBoost — each inside an sklearn `Pipeline` (StandardScaler + classifier)
to prevent preprocessing leakage, with stratified 80/20 train-test split and 5-fold
cross-validation.

**Current results** (reproducible via `python train_model.py`):

| Model | Accuracy | F1 | ROC-AUC |
|---|---|---|---|
| Logistic Regression | 89.4% | 0.890 | 0.965 |
| Decision Tree | 88.0% | 0.876 | 0.945 |
| Random Forest | 89.7% | 0.892 | 0.969 |
| Gradient Boosting | 89.6% | 0.892 | 0.969 |
| **XGBoost (selected)** | **90.1%** | **0.898** | **0.970** |

**Explainability:** feature importances from the selected tree-based model,
exposed via API and rendered as an interactive bar chart — described as
model-level importance, not a causal claim.

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
| POST | `/api/predictions` | Run ML inference, persist + generate alert if needed |
| GET | `/api/predictions`, `/latest`, `/high-risk`, `/{id}`, `/location/{id}` | Prediction history & filtering |
| GET/POST/PUT/DELETE | `/api/locations` | Location CRUD |
| GET | `/api/alerts`, `/active`, `/history`, `/{id}` | Alert feed |
| PATCH | `/api/alerts/{id}/status` | Update alert status |
| GET | `/api/landslide-events` | Real historical events, paginated/filterable |
| GET | `/api/models`, `/latest`, `/{id}` | Model version tracking |
| GET | `/api/model/info`, `/metrics`, `/features` | Trained model metadata |
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
alembic upgrade head
python train_model.py
python scripts/seed_database.py
uvicorn app.main:app --reload

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
| `APPS_SCRIPT_EMAIL_URL` / `APPS_SCRIPT_SHARED_SECRET` | backend | Real email delivery for OTP/reset — see Hinglish guide section 15 |
| `CORS_ORIGINS` / `FRONTEND_URL` | backend | Set to `localhost:5173` for local dev |

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