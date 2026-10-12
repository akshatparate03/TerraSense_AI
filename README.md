<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=TerraSense%20AI&fontSize=70&fontColor=fff&animation=twinkling&fontAlignY=35&desc=Landslide%20Risk%20Intelligence%20Platform&descAlignY=60&descSize=20" width="100%"/>

<img src="docs/assets/terrasense-hero.svg" alt="TerraSense AI — animated terrain banner" width="100%"/>

<a href="https://terrasenseai.netlify.app">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=22D3EE&center=true&vCenter=true&width=760&lines=Predict+landslide+risk+anywhere+on+Earth;Live+weather%2C+soil+%26+terrain+data+in+seconds;XGBoost+ML+%C2%B7+FastAPI+%C2%B7+React+%C2%B7+Three.js;Real-time+3D+terrain+%C2%B7+WebSocket+live+scan;Email+alerts+when+your+location+turns+risky" alt="Typing animation"/>
</a>

<br/><br/>

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-terrasenseai.netlify.app-0891b2?style=for-the-badge&logoColor=white)](https://terrasenseai.netlify.app)
[![API](https://img.shields.io/badge/⚙️%20API-terrasenseai--backend.onrender.com-46E3B7?style=for-the-badge&logoColor=white)](https://terrasenseai-backend.onrender.com/docs)
[![GitHub Repo](https://img.shields.io/badge/GitHub-TerrasenseAI-181717?style=for-the-badge&logo=github)](https://github.com/akshatparate03/TerrasenseAI)

<br/>

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-3.4-EC6B23?style=flat-square)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.8-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-R3F-000000?style=flat-square&logo=threedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-Live%20Scan-8B5CF6?style=flat-square)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

</div>

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## 📖 Table of Contents

- [🌍 About TerraSense AI](#-about-terrasense-ai)
- [✨ At a Glance](#-at-a-glance)
- [🏗️ Architecture Overview](#️-architecture-overview)
- [🔄 How It Works](#-how-it-works)
- [⚡ Tech Stack](#-tech-stack)
- [🎯 Core Features](#-core-features)
- [🧠 Machine Learning & Data](#-machine-learning--data)
- [🧭 Pages & Navigation](#-pages--navigation)
- [🔐 Security Features](#-security-features)
- [📁 Project Structure](#-project-structure)
- [🗄️ Database Schema](#️-database-schema)
- [🔌 API Endpoints](#-api-endpoints)
- [🚀 Setup & Installation](#-setup--installation)
- [🔑 Environment Variables](#-environment-variables)
- [🌐 Deployment](#-deployment)
- [⚙️ Performance Optimization](#️-performance-optimization)
- [🔧 Troubleshooting](#-troubleshooting)
- [👨‍💻 Owner](#-owner)

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## 🌍 About TerraSense AI

> **TerraSense AI** is a full-stack, software-only **landslide risk intelligence platform**. Pick any point on Earth and it pulls live weather, soil, elevation and nearby-construction data, feeds it into a trained **XGBoost** model, and returns a **LOW / MEDIUM / HIGH** risk level with the factors that drove it. Around that core sit a live global scan over a curated watchlist, interactive **3D terrain** visualisations, a replayable simulation archive, historical NASA landslide analytics and email alerts — all in a dark, glassy, animated UI.

It is built to be **honest about its data**: every environmental reading carries a status (`LIVE`, `CACHED`, `ESTIMATED`, `UNAVAILABLE`, `DEMO`), and when something can't be fetched the platform asks the user instead of silently guessing.

```
🌐 Live    → https://terrasenseai.netlify.app
⚙️ API     → https://terrasenseai-backend.onrender.com/docs
```

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## ✨ At a Glance

<div align="center">

|     🎯 Risk Levels      | 🌐 Live Scan Watchlist |        🧠 Model         | 📈 ROC-AUC |        🗺️ 3D Views         |
| :---------------------: | :--------------------: | :---------------------: | :--------: | :------------------------: |
| **LOW · MEDIUM · HIGH** | **27** curated regions | **XGBoost** (best of 5) | **0.9695** | **2** interactive terrains |

</div>

<table>
<tr>
<td width="50%" valign="top">

**🛰️ Live data in, risk out**
Open-Meteo weather & elevation, ISRIC SoilGrids soil, and OpenStreetMap buildings/construction — fetched per click and cached.

</td>
<td width="50%" valign="top">

**🌋 Real-data 3D terrain**
Home shows worldwide landslides from the last 12 months; the Dashboard shows only _your_ predicted locations — green, yellow and red.

</td>
</tr>
<tr>
<td width="50%" valign="top">

**📡 Streaming live scan**
A WebSocket streams each watchlist location's result the moment it's computed, with a live "searching…" progress bar.

</td>
<td width="50%" valign="top">

**📧 Alerts that reach you**
Subscribe a location; a background scheduler re-checks it and emails you when risk crosses your threshold.

</td>
</tr>
</table>

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                       TERRASENSE AI ARCHITECTURE                      │
├────────────────┬─────────────────────┬───────────────────────────────┤
│    Frontend    │       Backend       │          Data Layer           │
│   React 18     │   FastAPI (async)   │  PostgreSQL — Neon (cloud)    │
│   Vite 5       │   REST + WebSocket  │  NASA Global Landslide CSV    │
│   TailwindCSS  │   XGBoost inference │  Trained model (.joblib)      │
│   Three.js/R3F │   APScheduler jobs  │  Live APIs: Open-Meteo,       │
│   Leaflet      │   Alembic migrations│  SoilGrids, OSM Overpass      │
│   Netlify      │   Render            │                               │
└────────────────┴─────────────────────┴───────────────────────────────┘
          │                  │                       │
          └──────────────────┴───────────────────────┘
                     REST + WebSocket + JWT
```

> **No Redis required.** Caching lives in the database (`geo_feature_cache`), background work runs on APScheduler, and WebSockets are built into FastAPI.

```mermaid
flowchart LR
    U([👤 User]) --> FE[React + Three.js<br/>Netlify]
    FE -- REST /api --> BE[FastAPI<br/>Render]
    FE -- WebSocket /ws --> BE
    BE --> DB[(PostgreSQL<br/>Neon)]
    BE --> ML[[XGBoost pipeline<br/>.joblib]]
    BE --> OM[Open-Meteo<br/>weather + elevation]
    BE --> SG[SoilGrids<br/>soil]
    BE --> OSM[OSM Overpass<br/>buildings]
    BE --> NASA[NASA COOLR<br/>recent landslides]
    BE --> MAIL[Google Apps Script<br/>email]
    SCH[[APScheduler]] --> BE
```

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## 🔄 How It Works

### 1️⃣ Live location prediction

```mermaid
sequenceDiagram
    actor User
    participant FE as Predict page
    participant API as FastAPI
    participant Geo as Geo data service
    participant ML as XGBoost model
    User->>FE: Pick a point on the map
    FE->>API: GET /api/location/features
    API->>Geo: weather · elevation · soil · buildings
    Geo-->>API: values + per-source status
    alt soil / buildings / construction missing
        FE-->>User: Dialog — use estimated values, or enter your own?
        User->>FE: "I have these values"
        FE-->>User: Manual tab, fetched fields pre-filled
    end
    FE->>API: POST /api/predictions (or /location)
    API->>ML: feature vector
    ML-->>API: probability + risk level + drivers
    API-->>FE: result (saved to your history)
```

### 2️⃣ Live Risk Scan (WebSocket)

```mermaid
sequenceDiagram
    actor User
    participant Home as Home page
    participant WS as /ws/live-scan
    User->>Home: Start Live Scan
    Home->>WS: connect + "start"
    WS-->>Home: scan_started (total)
    loop each watchlist location
        WS-->>Home: location_result (risk %, level)
        Home-->>User: row appears · "Searching… 5 of 27"
    end
    WS-->>Home: scan_complete (sorted, highest risk first)
```

### 3️⃣ Colour logic on the 3D terrains

|    Colour     | Home — worldwide landslides (last 12 months)             | Dashboard — your predictions |
| :-----------: | -------------------------------------------------------- | ---------------------------- |
|  🟥 **Red**   | ≥ 1 fatality, or large / very large / catastrophic slide | HIGH risk                    |
| 🟨 **Yellow** | Medium-size slide, or injuries reported                  | MEDIUM risk                  |
| 🟩 **Green**  | Everything else (small / unknown, no casualties)         | LOW risk                     |

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## ⚡ Tech Stack

### 🖥️ Backend

| Technology                         | Version              | Purpose                        |
| ---------------------------------- | -------------------- | ------------------------------ |
| **Python**                         | 3.12                 | Core language                  |
| **FastAPI**                        | 0.115.6              | Async REST API + WebSockets    |
| **Uvicorn**                        | 0.34.0               | ASGI server                    |
| **Pydantic**                       | 2.10.4               | Request/response validation    |
| **SQLAlchemy**                     | 2.0.36               | ORM                            |
| **Alembic**                        | 1.14.0               | Database migrations            |
| **PostgreSQL** (psycopg2)          | Neon                 | Primary database               |
| **XGBoost**                        | 3.4.1                | Landslide risk model           |
| **scikit-learn**                   | 1.8.0                | Pipeline, training, evaluation |
| **pandas / NumPy / PyArrow**       | 2.2.3 / 2.2.1 / 17.0 | Data processing                |
| **APScheduler**                    | 3.10.4               | Background monitoring jobs     |
| **python-jose / passlib + bcrypt** | 3.3.0 / 1.7.4        | JWT auth, password hashing     |
| **google-auth**                    | 2.36.0               | Google Sign-In verification    |
| **httpx / requests**               | 0.28.1 / 2.32.3      | Live external API calls        |

### 🎨 Frontend

| Technology                               | Version              | Purpose                  |
| ---------------------------------------- | -------------------- | ------------------------ |
| **React**                                | 18.3                 | UI library               |
| **Vite**                                 | 5.4                  | Build tool & dev server  |
| **TailwindCSS**                          | 3.4                  | Utility-first styling    |
| **React Router**                         | 6.28                 | Client-side routing      |
| **Three.js + @react-three/fiber + drei** | 0.170 / 8.17 / 9.117 | Interactive 3D terrain   |
| **Leaflet + react-leaflet**              | 1.9 / 4.2            | Interactive maps         |
| **Framer Motion**                        | 11                   | Animations & transitions |
| **Recharts**                             | 2.13                 | Charts & analytics       |
| **Axios**                                | 1.7                  | HTTP client              |
| **Lucide React**                         | 0.462                | Icons                    |

### ☁️ Infrastructure & Data Sources

| Service                                   | Role                                       |
| ----------------------------------------- | ------------------------------------------ |
| **Netlify**                               | Frontend hosting                           |
| **Render**                                | Backend hosting                            |
| **Neon**                                  | Serverless PostgreSQL                      |
| **Open-Meteo**                            | Live weather + elevation (free, keyless)   |
| **ISRIC SoilGrids**                       | Soil texture / pH                          |
| **OpenStreetMap Overpass**                | Buildings & construction sites             |
| **NASA Global Landslide Catalog / COOLR** | Historical + recent landslide events       |
| **Google Apps Script**                    | Transactional email (OTP, alerts, contact) |

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## 🎯 Core Features

<details>
<summary><b>🛰️ Live Risk Scan (Home page)</b></summary>

- Scans **27 curated landslide-prone regions** worldwide using _current_ weather, soil and terrain data
- Results **stream in over WebSocket** as each location finishes — no waiting for the whole batch
- Highest-risk first, with a live **"Searching… X of 27"** progress bar and per-row "checking…" placeholders
- Watchlist map with blinking markers coloured by the latest result
- Clearly flags `DEMO DATA` when the backend runs in offline mock mode

</details>

<details>
<summary><b>🌋 Interactive 3D Terrain</b></summary>

- **Home:** worldwide landslides of the **last 12 months**, each placed on the terrain by its real latitude/longitude — NASA's live COOLR layer first, bundled catalog as fallback (with an honest "latest data available" note)
- **Dashboard:** _only your own_ predicted locations (from any page), latest result per place
- Dark green / dark yellow / dark red markers, labels, click-to-interact, fullscreen
- Hundreds of points rendered through a single instanced mesh for smooth performance

</details>

<details>
<summary><b>🎯 Risk Prediction</b></summary>

- **Live Location mode** — click the map or use your current location; configurable analysis radius
- Pulls weather, elevation/slope, soil and construction data automatically, each tagged with its data status
- **Missing-data dialog** — if soil texture, nearby buildings or construction sites can't be fetched, you choose **"Use estimated values"** or **"I have these values"**
- "I have these values" opens **Manual Entry** with everything that _was_ fetched pre-filled — you only type what's missing
- Result shows probability, risk level, top risk drivers and any values you supplied yourself
- **Manual Entry mode** for what-if experiments

</details>

<details>
<summary><b>📊 Dashboard & Analytics</b></summary>

- Personal dashboard: prediction counts, risk distribution, high-risk locations, recent predictions, active alerts
- Analytics over the real NASA catalog: descriptive statistics and seasonal trends

</details>

<details>
<summary><b>📜 Historical Events & Simulation Archive</b></summary>

- Browse and filter real recorded landslides (location, date, trigger, size, casualties)
- **Simulation engine** replays historical events step by step with start / pause / resume / stop / speed controls
- Completed runs are archived and can be reviewed later

</details>

<details>
<summary><b>📍 Locations & Map</b></summary>

- Create, edit and delete your own monitored locations
- Map view of your locations and their latest risk

</details>

<details>
<summary><b>🔔 Alerts & Email Monitoring</b></summary>

- Subscribe a location with your own **alert threshold**, **reset threshold** and **cooldown**
- A background scheduler re-evaluates subscriptions on an interval and **emails you** when risk crosses the threshold
- Alert history, email log and status management
- Cap on active subscriptions per user

</details>

<details>
<summary><b>🔑 Authentication</b></summary>

- Register → **email OTP verification** → set password
- Login with email/password or **Google Sign-In**
- Forgot / reset password via time-limited token
- Protected routes with automatic session handling

</details>

<details>
<summary><b>📬 Contact & Legal</b></summary>

- Contact form delivered by email
- Terms & Conditions and Privacy Policy pages

</details>

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## 🧠 Machine Learning & Data

### Selected model — XGBoost

Five candidates were trained and compared (Logistic Regression, Decision Tree, Random Forest, Gradient Boosting, XGBoost); the best by cross-validated F1 / ROC-AUC is served in production.

| Metric               |       Score       |
| -------------------- | :---------------: |
| Accuracy             |    **90.0 %**     |
| Precision            |    **92.1 %**     |
| Recall               |    **87.5 %**     |
| F1-score             |    **89.8 %**     |
| ROC-AUC              |    **0.9695**     |
| 5-fold CV F1         | **0.899 ± 0.005** |
| Train / test samples |  17,652 / 4,414   |

### 13 input features

| Group              | Features                                                            |
| ------------------ | ------------------------------------------------------------------- |
| 📍 Location & time | `latitude`, `longitude`, `month`, `location_accuracy_km`            |
| ⚡ Trigger         | `trigger_is_rain`, `trigger_is_seismic`, `trigger_is_other`         |
| 🌦️ Environment     | `rainfall_mm`, `soil_moisture_pct`, `temperature_c`, `humidity_pct` |
| ⛰️ Terrain         | `slope_deg`, `elevation_m`                                          |

**Strongest drivers** (feature importance): rainfall ≈ 45 %, soil moisture ≈ 15 %, slope ≈ 6 %.

### 🔍 Transparency notes

- Training positives come from the **real NASA Global Landslide Catalog (1988–2017)**; negatives are **pseudo-absence** samples.
- In the training data, the six environmental columns (rainfall, soil moisture, slope, elevation, temperature, humidity) are **simulated**, not measured per event. At prediction time the app feeds in **live measured values** instead — so treat results as a decision-support signal, **not** an official hazard warning.
- Risk levels use configurable thresholds: **MEDIUM ≥ 0.35**, **HIGH ≥ 0.65**.

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## 🧭 Pages & Navigation

| Page                                      | Route                                                                                   | Where to find it        |
| ----------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------- |
| Home (hero · 3D terrain · Live Risk Scan) | `/`                                                                                     | Sidebar                 |
| Dashboard                                 | `/dashboard`                                                                            | Sidebar + footer        |
| Risk Prediction                           | `/predict`                                                                              | Sidebar + footer        |
| Historical Events                         | `/historical`                                                                           | Sidebar + footer        |
| Simulation Archive                        | `/simulation-archive`                                                                   | Sidebar + footer        |
| Manage Locations                          | `/locations`                                                                            | Sidebar + footer        |
| Alerts                                    | `/alerts`                                                                               | Sidebar + footer        |
| Analytics                                 | `/analytics`                                                                            | Footer · _Intelligence_ |
| Locations / Map                           | `/map`                                                                                  | Footer · _Intelligence_ |
| About System                              | `/about`                                                                                | Footer · _Intelligence_ |
| Contact · Privacy · Terms                 | `/contact` `/privacy` `/terms`                                                          | Footer · _Company_      |
| Auth                                      | `/login` `/register` `/verify-otp` `/set-password` `/forgot-password` `/reset-password` | Public                  |

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## 🔐 Security Features

<details>
<summary><b>🔑 JWT Authentication</b></summary>

- Stateless HS256-signed JWT access tokens with configurable expiry
- Token verified on every protected request through a FastAPI dependency
- Google ID tokens verified server-side with `google-auth`
- Optional-auth dependency for endpoints that work for both guests and users

</details>

<details>
<summary><b>🔒 Passwords & Verification</b></summary>

- bcrypt hashing with automatic salting — no plain-text storage
- Server-enforced password rules (exposed at `/api/auth/password-rules`)
- Email **OTP verification** with expiry and resend
- Password-reset tokens are time-limited

</details>

<details>
<summary><b>🛡️ API Hardening</b></summary>

- Pydantic validation on every request body and bounded numeric ranges
- SQLAlchemy ORM — parameterised queries, no string-built SQL
- **CORS whitelist** — only the configured frontend origin
- Per-user data isolation (your predictions and dashboard points are yours only)
- Netlify security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`

</details>

<details>
<summary><b>🔏 Data Honesty</b></summary>

- Every external reading carries a status — nothing is silently fabricated
- Estimated or user-supplied values are labelled in the result
- Secrets live only in environment variables, never in the repo

</details>

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## 📁 Project Structure

```
TerrasenseAI/
├── backend/                 # FastAPI + ML + DB
├── frontend/                # React 18 + Vite + Tailwind + Three.js
├── DEPLOY.md                # Step-by-step deployment guide
├── .python-version
├── .gitignore
└── README.md
```

### Backend

```
backend/
├── app/
│   ├── main.py                       # App, WebSocket endpoints, simulation & dataset routes
│   ├── api/
│   │   ├── auth.py                   # Register, OTP, login, Google, reset
│   │   ├── predictions.py            # Predict, live-location predict, user points
│   │   ├── global_scan.py            # Watchlist + scan results
│   │   ├── recent_landslides.py      # Last-12-months worldwide landslides
│   │   ├── landslide_events.py       # Historical events
│   │   ├── locations.py              # Location CRUD
│   │   ├── alerts.py                 # Alerts + email history
│   │   ├── monitoring.py             # Monitoring start/stop/status
│   │   ├── analytics_api.py          # Analytics endpoints
│   │   ├── models_api.py             # Model run registry
│   │   └── health.py                 # Health JSON + status page
│   ├── core/                         # config, database, deps, security
│   ├── ml/                           # data_pipeline, inference
│   ├── models/db_models.py           # SQLAlchemy tables
│   ├── schemas/                      # Pydantic schemas
│   ├── services/
│   │   ├── geo_data_service.py       # Open-Meteo · SoilGrids · Overpass + cache
│   │   ├── global_scan_service.py    # Watchlist scan engine
│   │   ├── recent_landslides_service.py
│   │   ├── monitoring_service.py     # Scheduled alert checks
│   │   ├── email_service.py          # Apps Script mailer
│   │   ├── auth_service.py
│   │   ├── history_service.py
│   │   └── db_service.py
│   └── simulation/engine.py          # Historical event replay
├── migrations/versions/              # Alembic migrations
├── models/                           # Trained pipeline + metadata
├── artifacts/                        # Metrics, ROC, confusion matrix, importances
├── data/                             # NASA catalog + master dataset
├── scripts/
│   ├── seed_database.py              # Seeds watchlist locations + model record
│   └── build_master_dataset.py
├── tests/                            # API, geo-data and monitoring tests
├── requirements.txt
└── .env
```

### Frontend

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx                    # Sidebar + footer shell
│   │   ├── Footer.jsx                    # Platform / Intelligence / Company links
│   │   ├── LiveRiskScanSection.jsx       # Streaming live scan (Home)
│   │   ├── TerrainVisualization.jsx      # 3D terrain (instanced data points)
│   │   ├── MissingDataDialog.jsx         # "Estimated or my own values?" dialog
│   │   ├── MapPicker.jsx · LocationSearch.jsx
│   │   ├── EmailAlertSettings.jsx
│   │   └── ProtectedRoute.jsx · AuthShell.jsx · ui.jsx · Seo.jsx
│   ├── context/AuthContext.jsx
│   ├── pages/
│   │   ├── Home.jsx · Dashboard.jsx · Predict.jsx · Analytics.jsx
│   │   ├── Historical.jsx · SimulationArchive.jsx · MapView.jsx
│   │   ├── Locations.jsx · Alerts.jsx · About.jsx · Contact.jsx
│   │   ├── Privacy.jsx · Terms.jsx
│   │   └── auth/  (Login · Register · VerifyOtp · SetPassword · Forgot · Reset)
│   ├── services/api.js
│   ├── utils/
│   ├── App.jsx · main.jsx · index.css
├── .env.production                       # Production build settings (Netlify)
├── netlify.toml
├── vite.config.js
└── package.json
```

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## 🗄️ Database Schema

| Table                    | Purpose                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `users`                  | Accounts (email, hashed password, Google link, verification state) |
| `otp_verifications`      | Email OTP codes with expiry                                        |
| `password_reset_tokens`  | Time-limited reset tokens                                          |
| `locations`              | Monitored places — `is_watchlist` marks the public Live Scan set   |
| `environmental_readings` | Stored weather / terrain readings per location                     |
| `predictions`            | Every prediction (probability, level, source, optional `user_id`)  |
| `alerts`                 | Generated risk alerts and their status                             |
| `model_runs`             | Trained-model versions and metrics                                 |
| `landslide_events`       | Imported historical NASA events (optional)                         |
| `geo_feature_cache`      | Cached live geo lookups (TTL-based)                                |
| `alert_subscriptions`    | Per-user email alert rules                                         |
| `email_alert_log`        | Sent-email audit log                                               |

Tables are created and evolved with **Alembic** (`alembic upgrade head`).

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## 🔌 API Endpoints

Interactive docs: **`/docs`** (Swagger) on the running backend.

### 🔑 Authentication — `/api/auth`

| Method | Endpoint                               | Description                    |
| ------ | -------------------------------------- | ------------------------------ |
| `GET`  | `/password-rules`                      | Password policy                |
| `POST` | `/register`                            | Start registration (sends OTP) |
| `POST` | `/verify-otp` · `/resend-otp`          | Verify / resend email OTP      |
| `POST` | `/set-password`                        | Finish registration → JWT      |
| `POST` | `/login`                               | Email + password → JWT         |
| `POST` | `/google`                              | Google Sign-In → JWT           |
| `POST` | `/forgot-password` · `/reset-password` | Password reset flow            |
| `GET`  | `/me`                                  | Current user                   |
| `POST` | `/logout`                              | Logout                         |

### 🎯 Predictions — `/api/predictions` · `/api/location`

| Method | Endpoint                                   | Description                                   |
| ------ | ------------------------------------------ | --------------------------------------------- |
| `GET`  | `/api/location/features`                   | Fetch live features + data status for a point |
| `POST` | `/api/predictions`                         | Predict from manual/site values               |
| `POST` | `/api/predictions/location`                | Predict from live-fetched data                |
| `GET`  | `/api/predictions`                         | Prediction history                            |
| `GET`  | `/api/predictions/mine/points`             | **Your** predicted locations (Dashboard 3D)   |
| `GET`  | `/api/predictions/latest` · `/high-risk`   | Latest / high-risk predictions                |
| `GET`  | `/api/predictions/location/{id}` · `/{id}` | By location / by id                           |

### 🛰️ Scan & Landslides

| Method | Endpoint                                                | Description                                   |
| ------ | ------------------------------------------------------- | --------------------------------------------- |
| `GET`  | `/api/scan/locations`                                   | Live-scan watchlist                           |
| `POST` | `/api/scan/run`                                         | Run a scan                                    |
| `GET`  | `/api/scan/latest`                                      | Latest scan results                           |
| `GET`  | `/api/recent-landslides`                                | Worldwide landslides, last 12 months (public) |
| `GET`  | `/api/landslide-events` · `/{id}`                       | Historical events                             |
| `GET`  | `/api/dataset/historical` · `/analytics` · `/locations` | Catalog data                                  |

### 📍 Locations · 🔔 Alerts · 📡 Monitoring

| Method           | Endpoint                                                  | Description            |
| ---------------- | --------------------------------------------------------- | ---------------------- |
| `GET/POST`       | `/api/locations`                                          | List / create          |
| `GET/PUT/DELETE` | `/api/locations/{id}`                                     | Read / update / delete |
| `GET`            | `/api/alerts` · `/active` · `/history` · `/email-history` | Alerts & email log     |
| `POST`           | `/api/alerts/test`                                        | Send a test alert      |
| `PATCH`          | `/api/alerts/{id}/status`                                 | Update status          |
| `POST`           | `/api/monitoring/start` · `/stop`                         | Control monitoring     |
| `GET`            | `/api/monitoring/status`                                  | Monitoring status      |

### 📊 Analytics & Platform

| Method | Endpoint                                                                                                      | Description           |
| ------ | ------------------------------------------------------------------------------------------------------------- | --------------------- |
| `GET`  | `/api/analytics/overview` · `/risk-distribution` · `/location-summary` · `/timeline` · `/alerts`              | Analytics             |
| `GET`  | `/api/dashboard/summary`                                                                                      | Dashboard summary     |
| `GET`  | `/api/stats/public`                                                                                           | Public homepage stats |
| `GET`  | `/api/models` · `/latest` · `/{id}`                                                                           | Model runs            |
| `GET`  | `/api/model/info` · `/metrics` · `/features` · `/confusion-matrix` · `/roc-curve` · `/precision-recall-curve` | Model artifacts       |
| `POST` | `/api/simulation/start` · `/pause` · `/resume` · `/stop` · `/reset` · `/speed`                                | Simulation control    |
| `GET`  | `/api/simulation/status` · `/full-history`                                                                    | Simulation state      |
| `POST` | `/api/contact`                                                                                                | Contact form          |
| `GET`  | `/api/health` · `/api/health/status`                                                                          | Health page / JSON    |

### 🔌 WebSockets

| Endpoint         | Purpose                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `/ws/live-scan`  | Streams `scan_started` → `location_result` × N → `scan_complete` |
| `/ws/monitoring` | Live simulation / monitoring updates                             |

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## 🚀 Setup & Installation

### 📋 Prerequisites

| Requirement | Version                        |
| ----------- | ------------------------------ |
| Python      | 3.12                           |
| Node.js     | 20+                            |
| PostgreSQL  | 14+ (local) or a Neon database |
| Git         | any                            |

### 📦 Ports

| Service           | Port | URL                   |
| ----------------- | ---- | --------------------- |
| Frontend (Vite)   | 5173 | http://localhost:5173 |
| Backend (FastAPI) | 8000 | http://localhost:8000 |

> The Vite dev server **proxies** `/api`, `/ws` and `/artifacts` to the backend, so no CORS setup is needed locally.

### ⚙️ Backend

```bash
cd backend

# 1. Virtual environment
python -m venv .venv
source .venv/bin/activate        # Linux / Mac
.venv\Scripts\activate           # Windows

# 2. Dependencies
pip install -r requirements.txt

# 3. Environment — copy the template and fill in DATABASE_URL, JWT_SECRET, ...
cp .env.example .env

# 4. Create tables
alembic upgrade head

# 5. Seed the 27 watchlist locations (add --skip-events to skip the optional events import)
python scripts/seed_database.py

# 6. Run
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> Backend → **http://localhost:8000** · API docs → **http://localhost:8000/docs**

### 🎨 Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
```

### 🧪 Tests

```bash
cd backend
pytest
```

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## 🔑 Environment Variables

### Backend — `backend/.env`

```env
# ===== DATABASE (Neon or local PostgreSQL) =====
DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require

# ===== URLs =====
CORS_ORIGINS=https://terrasenseai.netlify.app
FRONTEND_URL=https://terrasenseai.netlify.app

# ===== AUTH =====
JWT_SECRET=generate-a-long-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=10080
GOOGLE_CLIENT_ID=your-google-oauth-web-client-id

# ===== EMAIL (Google Apps Script) =====
APPS_SCRIPT_EMAIL_URL=your-apps-script-web-app-url
APPS_SCRIPT_SHARED_SECRET=your-shared-secret

# ===== BEHAVIOUR =====
MOCK_EXTERNAL_APIS=false          # true = offline demo data
MONITORING_ENABLED=true
MONITORING_INTERVAL_MINUTES=15
RECENT_LANDSLIDES_LIVE=true       # NASA live layer first, bundled catalog as fallback
```

> See `backend/.env.example` for every option (thresholds, geo cache, radius limits, alert defaults).

### Frontend — `frontend/.env.production`

```env
VITE_API_BASE_URL=https://terrasenseai-backend.onrender.com/api
VITE_WS_BASE_URL=wss://terrasenseai-backend.onrender.com/ws/monitoring
VITE_GOOGLE_CLIENT_ID=your-google-oauth-web-client-id
```

> ⚠️ Never commit `backend/.env` — it contains secrets. Frontend `VITE_` values are public by design.

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## 🌐 Deployment

> 📘 The full step-by-step guide lives in **[`DEPLOY.md`](DEPLOY.md)**. Short version:

### 🎨 Frontend → Netlify

```bash
# Base directory : frontend
# Build command  : npm run build
# Publish dir    : dist
# Live URL       : https://terrasenseai.netlify.app
```

`netlify.toml` already contains the SPA redirect (`/* → /index.html`) and security headers.

### ⚙️ Backend → Render

```bash
# Root Directory : backend
# Build command  : pip install -r requirements.txt && alembic upgrade head && python scripts/seed_database.py --skip-events
# Start command  : uvicorn app.main:app --host 0.0.0.0 --port $PORT
# Health check   : /api/health/status
# Env vars       : paste backend production env (PYTHON_VERSION=3.12.8 included)
```

### 🗄️ Database → Neon

```bash
# 1. Create a project at neon.tech
# 2. Copy the connection string (sslmode=require)
# 3. Set it as DATABASE_URL on Render — Alembic creates the tables on deploy
```

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## ⚙️ Performance Optimization

<details>
<summary><b>🗃️ Database & Caching</b></summary>

- Live geo lookups cached in `geo_feature_cache` (TTL + coordinate rounding) — repeated clicks don't re-hit free APIs
- `pool_pre_ping` and `pool_recycle` keep connections healthy on serverless Postgres (Neon)
- Recent-landslides results cached in memory for hours

</details>

<details>
<summary><b>🌋 3D Rendering</b></summary>

- Hundreds of terrain points drawn with **one instanced mesh** and per-instance colour
- Pixel ratio capped, WebGL context-loss handled gracefully
- Controls activate on click so page scroll is never hijacked

</details>

<details>
<summary><b>🔌 WebSocket Efficiency</b></summary>

- Scan results are pushed one-by-one — UI updates instantly with no polling
- Single connection per scan, closed automatically on completion

</details>

<details>
<summary><b>🌐 Frontend</b></summary>

- Vite production build with hashed assets
- Skeleton loading states for data-heavy sections
- Lightweight Framer Motion animations

</details>

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## 🔧 Troubleshooting

<details>
<summary><b>❌ Live Risk Scan shows an empty map / no results</b></summary>

- The watchlist locations must exist in the database: run `python scripts/seed_database.py`
- Restart the backend — it automatically re-flags the curated locations on startup
- Check `GET /api/scan/locations` returns locations

</details>

<details>
<summary><b>❌ "Network Error" or CORS errors in production</b></summary>

- On Render's free plan the backend sleeps when idle — the first request can take ~50 s
- `CORS_ORIGINS` must be exactly `https://terrasenseai.netlify.app` (no trailing `/`)
- Confirm `VITE_API_BASE_URL` points at the Render URL ending in `/api`

</details>

<details>
<summary><b>❌ Database connection error</b></summary>

- Verify `DATABASE_URL` (Neon needs `sslmode=require`)
- Run `alembic upgrade head` after any schema change
- Neon may need a moment to wake after idling

</details>

<details>
<summary><b>❌ Live data unavailable for a location</b></summary>

- Open-Meteo, SoilGrids and Overpass are free public services and can be temporarily down
- The Predict page will ask whether to use estimated values or enter your own
- Set `MOCK_EXTERNAL_APIS=true` for offline development

</details>

<details>
<summary><b>❌ OTP email not arriving</b></summary>

- Check `APPS_SCRIPT_EMAIL_URL` and `APPS_SCRIPT_SHARED_SECRET`
- The Apps Script web app must be deployed with access for "Anyone"
- Look in spam, and check backend logs

</details>

<details>
<summary><b>❌ Google Sign-In "origin not allowed"</b></summary>

- Add `https://terrasenseai.netlify.app` (and `http://localhost:5173`) to **Authorized JavaScript origins** in Google Cloud Console

</details>

<details>
<summary><b>❌ Build errors</b></summary>

```bash
# Backend
python --version          # 3.12
pip install -r requirements.txt

# Frontend
node -v                   # 20+
rm -rf node_modules package-lock.json && npm install
```

</details>

<img src="docs/assets/divider.svg" width="100%" alt=""/>

## 👨‍💻 Owner

<div align="center">

<img src="https://avatars.githubusercontent.com/akshatparate03" alt="Akshat Parate" width="100" style="border-radius: 50%"/>

### **Akshat Parate**

_Full Stack Developer · Designer · Builder_

[![Portfolio](https://img.shields.io/badge/🌐%20Portfolio-akshatparate.netlify.app-0891b2?style=for-the-badge)](https://akshatparate.netlify.app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-akshatparate03-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/akshatparate03)
[![Instagram](https://img.shields.io/badge/Instagram-akshat__parate__2803-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/akshat_parate_2803)
[![GitHub](https://img.shields.io/badge/GitHub-akshatparate03-181717?style=for-the-badge&logo=github)](https://github.com/akshatparate03)

</div>

<img src="docs/assets/divider.svg" width="100%" alt=""/>

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=120&section=footer&animation=twinkling" width="100%"/>

**Built with ❤️ to make landslide risk easier to see, understand and act on.**

_Decision-support tool — not an official hazard warning system._

[![MIT License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red?style=flat-square)](https://terrasenseai.netlify.app)

</div>
