"""Unit tests for the pure (non-network, non-DB) parts of the geospatial data
engine: soil texture classification and response assembly / data-quality
logic. Live-API integration (Open-Meteo / SoilGrids / Overpass) is exercised
manually against the real services -- see README "Testing the Geo Data
Engine" -- since this sandbox environment has no outbound internet access to
mock reliably here.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.geo_data_service import GeoDataEngine  # noqa: E402


def test_classify_texture_clay_rich():
    assert GeoDataEngine._classify_texture(20, 30, 50) == "clay-rich"


def test_classify_texture_sandy():
    assert GeoDataEngine._classify_texture(75, 15, 10) == "sandy"


def test_classify_texture_silty():
    assert GeoDataEngine._classify_texture(20, 60, 20) == "silty"


def test_classify_texture_loam_default():
    assert GeoDataEngine._classify_texture(35, 35, 30) == "loam"


def test_classify_texture_missing_values_returns_none_not_a_guess():
    assert GeoDataEngine._classify_texture(None, 30, 40) is None
    assert GeoDataEngine._classify_texture(30, None, 40) is None
    assert GeoDataEngine._classify_texture(30, 30, None) is None


def _sample_sources():
    weather = {
        "status": "LIVE", "temperature_c": 22, "humidity_pct": 70,
        "rainfall_24h": 40.0, "soil_moisture_pct": 55.0,
    }
    elevation_slope = {"status": "LIVE", "elevation_m": 1800, "slope_deg": 32}
    soil = {"status": "LIVE", "soil_texture_class": "clay-rich"}
    construction = {"status": "LIVE", "building_count": 12}
    return weather, elevation_slope, soil, construction


def test_assemble_response_all_live_gives_high_quality_and_ready_features():
    engine = GeoDataEngine()
    weather, elevation_slope, soil, construction = _sample_sources()
    result = engine._assemble_response(31.10, 77.17, 5.0, weather, elevation_slope, soil, construction)

    assert result["data_quality"] == "HIGH"
    assert result["model_input_ready"] is True
    assert result["model_input_features"]["rainfall_mm"] == 40.0
    assert result["model_input_features"]["slope_deg"] == 32
    assert result["unavailable_sources"] == []


def test_assemble_response_missing_weather_blocks_prediction():
    engine = GeoDataEngine()
    _, elevation_slope, soil, construction = _sample_sources()
    weather = {"status": "UNAVAILABLE"}
    result = engine._assemble_response(31.10, 77.17, 5.0, weather, elevation_slope, soil, construction)

    # Weather is required -- no prediction should be attempted without it,
    # and no value should be fabricated in its place (spec section 57/92).
    assert result["model_input_ready"] is False
    assert result["model_input_features"] is None
    assert "weather" in result["unavailable_sources"]


def test_assemble_response_degrades_quality_with_partial_outage():
    engine = GeoDataEngine()
    weather, elevation_slope, soil, _construction = _sample_sources()
    construction = {"status": "UNAVAILABLE"}
    result = engine._assemble_response(31.10, 77.17, 5.0, weather, elevation_slope, soil, construction)

    assert result["data_quality"] == "MEDIUM"
    # Non-required source being down should not block the prediction.
    assert result["model_input_ready"] is True


def test_mock_result_is_deterministic_for_same_coordinates():
    engine = GeoDataEngine()
    r1 = engine._mock_result(31.1048, 77.1734, 5.0)
    r2 = engine._mock_result(31.1048, 77.1734, 5.0)
    assert r1["model_input_features"] == r2["model_input_features"]
    assert r1["data_quality"] == "DEMO"
    assert r1["demo_mode"] is True


def test_mock_result_varies_across_locations():
    engine = GeoDataEngine()
    r1 = engine._mock_result(31.1048, 77.1734, 5.0)
    r2 = engine._mock_result(8.0, 40.0, 5.0)
    assert r1["model_input_features"] != r2["model_input_features"]
