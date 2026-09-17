import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

# Use a dedicated test database so tests never touch dev/prod data.
os.environ["DATABASE_URL"] = os.getenv(
    "TEST_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/terrasense_test"
)

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

BACKEND_DIR = Path(__file__).parent.parent


@pytest.fixture(scope="session", autouse=True)
def disable_real_email_delivery():
    """Tests must never depend on (or accidentally trigger) a real external
    email service, regardless of what's configured in backend/.env for local
    development. Force the "no email backend configured" code path so OTP/
    reset flows fall back to the dev-mode log line instead of a real HTTP call."""
    from app.core.config import settings

    original = settings.APPS_SCRIPT_EMAIL_URL
    settings.APPS_SCRIPT_EMAIL_URL = ""
    yield
    settings.APPS_SCRIPT_EMAIL_URL = original


@pytest.fixture(scope="session", autouse=True)
def apply_migrations():
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_DIR / "migrations"))
    command.upgrade(cfg, "head")

    # Ensure a clean slate: truncate all app tables so repeated local test runs
    # (this test DB is not recreated automatically) don't collide on unique
    # constraints like user email.
    from sqlalchemy import create_engine, text

    engine = create_engine(os.environ["DATABASE_URL"])
    with engine.begin() as conn:
        conn.execute(
            text(
                "TRUNCATE TABLE alerts, predictions, environmental_readings, "
                "landslide_events, model_runs, locations, otp_verifications, "
                "password_reset_tokens, users RESTART IDENTITY CASCADE"
            )
        )
    engine.dispose()
    yield


@pytest.fixture(scope="session")
def client():
    from app.main import app

    return TestClient(app)


VALID_PREDICT_PAYLOAD = {
    "rainfall_mm": 150,
    "soil_moisture_pct": 80,
    "temperature_c": 21,
    "humidity_pct": 85,
    "slope_deg": 35,
    "elevation_m": 700,
    "latitude": 23.2,
    "longitude": 77.4,
    "trigger_hint": "rain",
}


# ---------------------------------------------------------------------------
# Health / DB connectivity
# ---------------------------------------------------------------------------
def test_health_and_db_connection(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["database_ready"] is True
    assert body["app_name"] == "TerraSense AI"


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
def test_auth_full_flow(client, monkeypatch):
    captured = {}

    from app.core import security

    original_otp = security.generate_otp

    def spy_otp():
        otp = original_otp()
        captured["otp"] = otp
        return otp

    monkeypatch.setattr("app.services.auth_service.generate_otp", spy_otp)

    r = client.post("/api/auth/register", json={"name": "Test User", "email": "pytest.user@example.com"})
    assert r.status_code == 200
    assert "otp" in captured

    # wrong otp rejected
    r = client.post("/api/auth/verify-otp", json={"email": "pytest.user@example.com", "otp": "000000"})
    assert r.status_code == 400

    # correct otp
    r = client.post("/api/auth/verify-otp", json={"email": "pytest.user@example.com", "otp": captured["otp"]})
    assert r.status_code == 200

    # weak password rejected
    r = client.post(
        "/api/auth/set-password",
        json={"email": "pytest.user@example.com", "password": "weak", "confirm_password": "weak"},
    )
    assert r.status_code == 400

    # strong password accepted -> token returned
    r = client.post(
        "/api/auth/set-password",
        json={"email": "pytest.user@example.com", "password": "Str0ng@Pass", "confirm_password": "Str0ng@Pass"},
    )
    assert r.status_code == 200
    token = r.json()["access_token"]
    assert token

    # duplicate registration rejected
    r = client.post("/api/auth/register", json={"name": "Test User", "email": "pytest.user@example.com"})
    assert r.status_code == 409

    # login works
    r = client.post("/api/auth/login", json={"email": "pytest.user@example.com", "password": "Str0ng@Pass"})
    assert r.status_code == 200

    # /me with token
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "pytest.user@example.com"

    # /me without token rejected
    r = client.get("/api/auth/me")
    assert r.status_code == 401


def test_forgot_and_reset_password(client, monkeypatch):
    captured = {}
    from app.core import security

    original = security.generate_reset_token

    def spy(*a, **kw):
        t = original()
        captured["token"] = t
        return t

    monkeypatch.setattr("app.services.auth_service.generate_reset_token", spy)

    r = client.post("/api/auth/forgot-password", json={"email": "pytest.user@example.com"})
    assert r.status_code == 200
    assert "token" in captured

    # forgot-password for unknown email returns the same generic message (no user enumeration)
    r2 = client.post("/api/auth/forgot-password", json={"email": "definitely.not.registered@example.com"})
    assert r2.status_code == 200
    assert r2.json() == r.json()

    r = client.post(
        "/api/auth/reset-password",
        json={
            "token": captured["token"],
            "email": "pytest.user@example.com",
            "new_password": "NewStr0ng@Pass",
            "confirm_password": "NewStr0ng@Pass",
        },
    )
    assert r.status_code == 200

    r = client.post("/api/auth/login", json={"email": "pytest.user@example.com", "password": "NewStr0ng@Pass"})
    assert r.status_code == 200

    r = client.post("/api/auth/login", json={"email": "pytest.user@example.com", "password": "Str0ng@Pass"})
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
def test_model_info_ready(client):
    r = client.get("/api/model/info")
    assert r.status_code == 200
    assert r.json()["ready"] is True


# ---------------------------------------------------------------------------
# Predictions (DB persistence)
# ---------------------------------------------------------------------------
def test_prediction_persists_to_db(client):
    r = client.post("/api/predictions", json=VALID_PREDICT_PAYLOAD)
    assert r.status_code == 200
    body = r.json()
    assert 0.0 <= body["landslide_probability"] <= 1.0
    assert body["risk_level"] in ("LOW", "MEDIUM", "HIGH")
    assert "prediction_id" in body

    r2 = client.get(f"/api/predictions/{body['prediction_id']}")
    assert r2.status_code == 200
    assert r2.json()["id"] == body["prediction_id"]


def test_prediction_invalid_input_rejected(client):
    bad = dict(VALID_PREDICT_PAYLOAD)
    bad["latitude"] = 999
    r = client.post("/api/predictions", json=bad)
    assert r.status_code == 422


def test_prediction_list_and_high_risk(client):
    high_risk_payload = dict(VALID_PREDICT_PAYLOAD, rainfall_mm=250, soil_moisture_pct=95, slope_deg=55)
    client.post("/api/predictions", json=high_risk_payload)

    r = client.get("/api/predictions", params={"limit": 5})
    assert r.status_code == 200
    assert r.json()["total"] >= 1

    r = client.get("/api/predictions/high-risk")
    assert r.status_code == 200
    assert isinstance(r.json()["items"], list)


# ---------------------------------------------------------------------------
# Locations CRUD
# ---------------------------------------------------------------------------
def test_locations_crud(client):
    r = client.post(
        "/api/locations",
        json={"name": "Pytest Test Location", "region": "Test Region", "country": "Testland", "latitude": 10.0, "longitude": 20.0},
    )
    assert r.status_code == 200
    loc_id = r.json()["id"]

    r = client.get(f"/api/locations/{loc_id}")
    assert r.status_code == 200
    assert r.json()["name"] == "Pytest Test Location"

    r = client.put(f"/api/locations/{loc_id}", json={"region": "Updated Region"})
    assert r.status_code == 200
    assert r.json()["region"] == "Updated Region"

    r = client.get("/api/locations")
    assert r.status_code == 200
    assert any(item["id"] == loc_id for item in r.json()["items"])

    r = client.delete(f"/api/locations/{loc_id}")
    assert r.status_code == 200


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------
def test_alert_generated_and_status_update(client):
    high_risk_payload = dict(VALID_PREDICT_PAYLOAD, rainfall_mm=280, soil_moisture_pct=97, slope_deg=60)
    pred = client.post("/api/predictions", json=high_risk_payload).json()
    assert pred["alert_generated"] is True

    r = client.get("/api/alerts/active")
    assert r.status_code == 200
    assert r.json()["total"] >= 1
    alert_id = r.json()["items"][0]["id"]

    r = client.patch(f"/api/alerts/{alert_id}/status", json={"status": "ACKNOWLEDGED"})
    assert r.status_code == 200
    assert r.json()["status"] == "ACKNOWLEDGED"

    r = client.patch(f"/api/alerts/{alert_id}/status", json={"status": "INVALID"})
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# Analytics (DB aggregation, not hardcoded)
# ---------------------------------------------------------------------------
def test_analytics_overview_reflects_real_data(client):
    r = client.get("/api/analytics/overview")
    assert r.status_code == 200
    body = r.json()
    assert body["total_predictions"] >= 1

    r = client.get("/api/analytics/risk-distribution")
    assert r.status_code == 200

    r = client.get("/api/analytics/location-summary")
    assert r.status_code == 200


# ---------------------------------------------------------------------------
# Simulation lifecycle (auto-stop at 500, no auto-restart, speed up to 50x)
# ---------------------------------------------------------------------------
def test_simulation_lifecycle(client):
    r = client.get("/api/simulation/status")
    assert r.status_code == 200
    assert r.json()["total_records"] == 500
    assert 50 in r.json()["speed_options"]

    r = client.post("/api/simulation/start", params={"speed": 50})
    assert r.status_code == 200
    assert r.json()["is_running"] is True

    r = client.post("/api/simulation/pause")
    assert r.json()["is_paused"] is True

    r = client.post("/api/simulation/reset")
    assert r.json()["current_index"] == 0
    assert r.json()["completed"] is False

    r = client.post("/api/simulation/stop")
    assert r.json()["is_running"] is False


def test_simulation_full_history_endpoint(client):
    r = client.get("/api/simulation/full-history")
    assert r.status_code == 200
    body = r.json()
    assert body["total_records"] == 500
    assert len(body["items"]) == 500
    assert body["items"][0]["index"] == 1
    assert body["items"][-1]["index"] == 500