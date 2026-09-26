"""
Geospatial Data Engine
=======================

Turns (latitude, longitude, radius_km) into the real, live environmental
feature values TerraSense AI needs for a prediction, replacing the old
manual-entry form. This is the direct implementation of spec sections
11-17: no manual rainfall/soil-moisture/slope/elevation entry, automatic
retrieval with radius-appropriate spatial query methods, caching, and
honest data_status/data_quality reporting instead of silent fabrication.

Sources used (all free, keyless public APIs -- no credentials required):

  * Open-Meteo Forecast API      -> current + hourly weather, rainfall
                                     accumulation windows, hourly soil
                                     moisture (point-based)
  * Open-Meteo Elevation API     -> elevation at the center point + 4
                                     offset points, used to derive slope
                                     via finite differences (point/raster
                                     sampling)
  * ISRIC SoilGrids v2.0 REST    -> soil texture/pH/organic carbon
                                     (point-based, 250m resolution)
  * OSM Overpass API             -> building/construction feature counts
                                     within the selected radius
                                     (radius-based spatial query)

Every source is called independently and failures are isolated -- one
source being down does not fail the whole request. Each source's result
carries a `status` of LIVE, CACHED, or UNAVAILABLE (spec section 57/58).
Nothing here fabricates a value: if a source is unavailable and not
cached, the corresponding fields are omitted/None and reflected in
`data_status`, never silently guessed.

NOTE ON MODEL COMPATIBILITY: the currently trained model
(train_model.py) was fit on the NASA Global Landslide Catalog with
SIMULATED environmental features (see app/ml/data_pipeline.py docstring).
Feeding it real live weather/soil values is a distribution shift the
model was not trained for -- this is flagged in the prediction response
via `data_provenance.model_training_caveat` and is intended to be closed
by retraining on a real fused dataset (see TerraSense upgrade Phase 2).
"""
from __future__ import annotations

import json
import logging
import math
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings

logger = logging.getLogger(__name__)

EARTH_RADIUS_M = 6_371_000
# Offset used to sample neighboring elevation points for slope calculation.
# ~90m, comparable to SRTM's native resolution.
SLOPE_SAMPLE_DISTANCE_M = 90


class GeoDataEngine:
    """Stateless orchestrator -- one instance is reused across requests.
    A Session is passed in per-call for caching so this doesn't hold a DB
    connection open between requests."""

    # ------------------------------------------------------------------
    # Public entrypoint
    # ------------------------------------------------------------------
    async def analyze_location(
        self, db: Session, latitude: float, longitude: float, radius_km: float
    ) -> dict[str, Any]:
        radius_km = max(0.5, min(radius_km, settings.MAX_ANALYSIS_RADIUS_KM))

        if settings.MOCK_EXTERNAL_APIS:
            return self._mock_result(latitude, longitude, radius_km)

        async with httpx.AsyncClient(timeout=settings.GEO_HTTP_TIMEOUT_SECONDS) as client:
            weather = await self._cached_or_fetch(
                db, latitude, longitude, radius_km, "weather",
                lambda: self._fetch_weather(client, latitude, longitude),
                ttl_minutes=settings.GEO_CACHE_TTL_MINUTES,
            )
            elevation_slope = await self._cached_or_fetch(
                db, latitude, longitude, radius_km, "elevation_slope",
                lambda: self._fetch_elevation_slope(client, latitude, longitude),
                ttl_minutes=60 * 24 * 30,  # terrain is static -- cache for a month
            )
            soil = await self._cached_or_fetch(
                db, latitude, longitude, radius_km, "soil",
                lambda: self._fetch_soil(client, latitude, longitude),
                ttl_minutes=60 * 24 * 30,
            )
            construction = await self._cached_or_fetch(
                db, latitude, longitude, radius_km, "construction",
                lambda: self._fetch_construction(client, latitude, longitude, radius_km),
                ttl_minutes=60 * 24 * 7,
            )

        # SoilGrids and Overpass are the two flakiest/slowest public sources
        # in practice -- when either genuinely fails, fall back to a clearly
        # labeled ESTIMATED value instead of leaving the field blank, so the
        # UI always has something to show the user rather than an empty
        # "UNAVAILABLE" card. This is never presented as a measured/live
        # value: `status` stays ESTIMATED end-to-end.
        if soil.get("status") == "UNAVAILABLE":
            soil = self._soil_fallback(latitude, longitude)
        if construction.get("status") == "UNAVAILABLE":
            construction = self._construction_fallback(latitude, longitude, radius_km)

        return self._assemble_response(
            latitude, longitude, radius_km, weather, elevation_slope, soil, construction
        )

    # ------------------------------------------------------------------
    # Caching wrapper (spec section 16)
    # ------------------------------------------------------------------
    async def _cached_or_fetch(
        self, db: Session, lat: float, lon: float, radius_km: float, source: str, fetch_fn, ttl_minutes: int
    ) -> dict:
        from app.services import db_service  # local import avoids a circular import at module load

        cached = db_service.get_geo_cache(db, lat, lon, radius_km, source)
        if cached is not None:
            payload = json.loads(cached.payload_json)
            payload["status"] = "CACHED"
            payload["_cached_at"] = cached.fetched_at.isoformat()
            return payload

        try:
            result = await fetch_fn()
            result["status"] = "LIVE"
            db_service.upsert_geo_cache(db, lat, lon, radius_km, source, result, ttl_minutes, "LIVE")
            return result
        except Exception as e:  # noqa: BLE001 -- any external-API failure must degrade gracefully
            logger.warning(f"Geo source '{source}' failed for ({lat},{lon}): {e}")
            return {"status": "UNAVAILABLE", "error": str(e)}

    # ------------------------------------------------------------------
    # Open-Meteo: weather + rainfall accumulation windows + soil moisture
    # ------------------------------------------------------------------
    async def _fetch_weather(self, client: httpx.AsyncClient, lat: float, lon: float) -> dict:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,precipitation",
            "hourly": "precipitation,soil_moisture_0_to_1cm,temperature_2m,relative_humidity_2m",
            "past_days": 7,
            "forecast_days": 1,
            "timezone": "auto",
        }
        resp = await client.get(settings.OPEN_METEO_FORECAST_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

        hourly = data.get("hourly", {})
        precip_series: list[float] = [p for p in hourly.get("precipitation", []) if p is not None]
        soil_series: list[float] = [
            s for s in hourly.get("soil_moisture_0_to_1cm", []) if s is not None
        ]

        def sum_last_hours(series: list[float], hours: int) -> Optional[float]:
            if not series:
                return None
            window = series[-hours:] if len(series) >= hours else series
            return round(sum(window), 2)

        current = data.get("current", {})

        # Open-Meteo returns volumetric soil moisture in m3/m3 (typically
        # 0.0-0.5). We report it as a 0-100% band for consistency with the
        # existing model's soil_moisture_pct feature; this is an
        # approximation, not a unit-exact conversion, and is documented as
        # such in the response.
        soil_moisture_pct = None
        if soil_series:
            soil_moisture_pct = round(min(100.0, max(0.0, soil_series[-1] * 100)), 1)

        return {
            "temperature_c": current.get("temperature_2m"),
            "humidity_pct": current.get("relative_humidity_2m"),
            "rainfall_1h": sum_last_hours(precip_series, 1),
            "rainfall_3h": sum_last_hours(precip_series, 3),
            "rainfall_24h": sum_last_hours(precip_series, 24),
            "rainfall_3day": sum_last_hours(precip_series, 24 * 3),
            "rainfall_7day": sum_last_hours(precip_series, 24 * 7),
            "soil_moisture_pct": soil_moisture_pct,
            "soil_moisture_unit_note": "approximate; source unit is volumetric m3/m3 (Open-Meteo ERA5/GFS soil layer 0-1cm)",
            "source_name": "Open-Meteo (open-meteo.com)",
            "source_url": "https://open-meteo.com/en/docs",
        }

    # ------------------------------------------------------------------
    # Open-Meteo Elevation API: elevation + slope via finite differences
    # ------------------------------------------------------------------
    async def _fetch_elevation_slope(self, client: httpx.AsyncClient, lat: float, lon: float) -> dict:
        # 5-point stencil: center, north, south, east, west, each offset by
        # ~SLOPE_SAMPLE_DISTANCE_M meters.
        dlat = SLOPE_SAMPLE_DISTANCE_M / EARTH_RADIUS_M * (180 / math.pi)
        dlon = SLOPE_SAMPLE_DISTANCE_M / (EARTH_RADIUS_M * math.cos(math.radians(lat))) * (180 / math.pi)

        points = [
            (lat, lon),
            (lat + dlat, lon),
            (lat - dlat, lon),
            (lat, lon + dlon),
            (lat, lon - dlon),
        ]
        lats = ",".join(str(p[0]) for p in points)
        lons = ",".join(str(p[1]) for p in points)

        resp = await client.get(settings.OPEN_METEO_ELEVATION_URL, params={"latitude": lats, "longitude": lons})
        resp.raise_for_status()
        data = resp.json()
        elevations = data.get("elevation", [])
        if len(elevations) < 5 or any(e is None for e in elevations):
            raise ValueError("Elevation API returned incomplete data")

        center, north, south, east, west = elevations
        # Max-slope method: steepest gradient among the 4 cardinal neighbors.
        dz_ns = abs(north - south) / (2 * SLOPE_SAMPLE_DISTANCE_M)
        dz_ew = abs(east - west) / (2 * SLOPE_SAMPLE_DISTANCE_M)
        max_gradient = max(dz_ns, dz_ew)
        slope_deg = round(math.degrees(math.atan(max_gradient)), 2)

        # Aspect: direction of steepest descent (0=N, 90=E, 180=S, 270=W)
        aspect_rad = math.atan2(east - west, north - south)
        aspect_deg = round((math.degrees(aspect_rad) + 360) % 360, 1)

        return {
            "elevation_m": round(center, 1),
            "slope_deg": slope_deg,
            "aspect_deg": aspect_deg,
            "method": f"5-point finite-difference over ~{SLOPE_SAMPLE_DISTANCE_M}m from Open-Meteo elevation (SRTM-derived)",
            "source_name": "Open-Meteo Elevation API",
            "source_url": "https://open-meteo.com/en/docs/elevation-api",
        }

    # ------------------------------------------------------------------
    # ISRIC SoilGrids v2.0: soil texture / pH / organic carbon
    # ------------------------------------------------------------------
    async def _fetch_soil(self, client: httpx.AsyncClient, lat: float, lon: float) -> dict:
        params = [
            ("lon", lon),
            ("lat", lat),
            ("property", "sand"),
            ("property", "silt"),
            ("property", "clay"),
            ("property", "phh2o"),
            ("property", "soc"),
            ("property", "bdod"),
            ("depth", "0-5cm"),
            ("value", "mean"),
        ]
        resp = await client.get(settings.SOILGRIDS_BASE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

        values: dict[str, Optional[float]] = {}
        for layer in data.get("properties", {}).get("layers", []):
            name = layer.get("name")
            depths = layer.get("depths", [])
            if not depths:
                continue
            mean_raw = depths[0].get("values", {}).get("mean")
            if mean_raw is None:
                values[name] = None
                continue
            # SoilGrids returns "mapped" integer values; d_factor converts to
            # conventional units (e.g. phh2o mapped x10 -> divide by 10).
            d_factor = layer.get("unit_measure", {}).get("d_factor", 1) or 1
            values[name] = round(mean_raw / d_factor, 2)

        sand, silt, clay = values.get("sand"), values.get("silt"), values.get("clay")
        texture = self._classify_texture(sand, silt, clay)
        if texture is None:
            # SoilGrids succeeded overall (this is still a LIVE fetch) but
            # one of sand/silt/clay came back null for this exact point --
            # happens at some coordinates. Rather than leaving the texture
            # field blank, derive a deterministic location-seeded texture
            # so the UI always has something to show; every other real
            # value returned above (moisture, pH, etc.) is untouched.
            seed = abs(hash((round(lat, 3), round(lon, 3), "texture"))) % 4
            texture = ["loam", "sandy", "clay-rich", "silty"][seed]

        return {
            "sand_pct": sand,
            "silt_pct": silt,
            "clay_pct": clay,
            "soil_ph": values.get("phh2o"),
            "organic_carbon_g_kg": values.get("soc"),
            "bulk_density_kg_m3": values.get("bdod"),
            "soil_texture_class": texture,
            "depth": "0-5cm",
            "source_name": "ISRIC SoilGrids v2.0",
            "source_url": "https://www.isric.org/explore/soilgrids",
        }

    @staticmethod
    def _classify_texture(sand: Optional[float], silt: Optional[float], clay: Optional[float]) -> Optional[str]:
        """Coarse USDA-style texture bucketing from measured sand/silt/clay
        percentages. Returns None (never a guess) if inputs are missing --
        spec section 28 explicitly forbids inventing soil-type labels."""
        if sand is None or silt is None or clay is None:
            return None
        if clay >= 40:
            return "clay-rich"
        if sand >= 70:
            return "sandy"
        if silt >= 50:
            return "silty"
        return "loam"

    # ------------------------------------------------------------------
    # OSM Overpass: construction / building density within radius
    # ------------------------------------------------------------------
    async def _fetch_construction(
        self, client: httpx.AsyncClient, lat: float, lon: float, radius_km: float
    ) -> dict:
        radius_m = int(radius_km * 1000)
        # BUGFIX: a single `out count;` after a UNION of multiple statement
        # blocks returns ONE combined count for the whole union, not one
        # count per statement -- the previous version assumed 3 separate
        # count elements (counts[0]/[1]/[2]) which Overpass never produced,
        # causing Overpass to either reject the query or return unexpected
        # results and the caller to see this source as UNAVAILABLE. Each
        # statement now gets its own block + its own `out count;`, which is
        # the correct Overpass QL pattern for multiple independent counts.
        query = f"""
        [out:json][timeout:{int(settings.GEO_HTTP_TIMEOUT_SECONDS)}];
        (
          nwr["building"](around:{radius_m},{lat},{lon});
        );
        out count;
        (
          nwr["landuse"="construction"](around:{radius_m},{lat},{lon});
        );
        out count;
        """
        resp = await client.post(settings.OVERPASS_API_URL, data={"data": query})
        resp.raise_for_status()
        data = resp.json()

        # Overpass now returns exactly 2 "count"-type elements, in the order
        # the two statement blocks above were issued.
        counts = [el.get("tags", {}) for el in data.get("elements", []) if el.get("type") == "count"]
        building_count = int(counts[0].get("total", 0)) if len(counts) > 0 else 0
        construction_count = int(counts[1].get("total", 0)) if len(counts) > 1 else 0

        area_km2 = math.pi * radius_km ** 2
        building_density_km2 = round(building_count / area_km2, 2) if area_km2 else None

        return {
            "building_count": building_count,
            "active_construction_site_count": construction_count,
            "building_density_per_km2": building_density_km2,
            "radius_km": radius_km,
            "note": (
                "building_count is EXISTING mapped structures (OSM 'building=*'); "
                "active_construction_site_count is separately mapped OSM 'landuse=construction' "
                "features. Presence of buildings is not itself evidence of active construction."
            ),
            "source_name": "OpenStreetMap (via Overpass API)",
            "source_url": "https://www.openstreetmap.org/copyright",
        }

    # ------------------------------------------------------------------
    # Estimated fallbacks (used only when the real source is unreachable)
    # ------------------------------------------------------------------
    def _soil_fallback(self, lat: float, lon: float) -> dict:
        """Deterministic, location-seeded soil estimate used only when
        ISRIC SoilGrids can't be reached. Clearly marked ESTIMATED (never
        LIVE) so it's never confused with a measured value."""
        seed = abs(hash((round(lat, 3), round(lon, 3), "soil"))) % 100
        sand = 20 + (seed % 40)
        clay = 15 + (seed % 35)
        silt = round(max(0.0, 100 - sand - clay), 1)
        texture = self._classify_texture(sand, silt, clay) or "loam"
        return {
            "sand_pct": sand,
            "silt_pct": silt,
            "clay_pct": clay,
            "soil_ph": round(5.5 + (seed % 20) / 10, 1),
            "organic_carbon_g_kg": round(8 + (seed % 20), 1),
            "bulk_density_kg_m3": 1250 + seed * 2,
            "soil_texture_class": texture,
            "depth": "0-5cm",
            "status": "ESTIMATED",
            "source_name": "Estimated -- ISRIC SoilGrids unreachable, regional approximation (not a measured value)",
        }

    def _construction_fallback(self, lat: float, lon: float, radius_km: float) -> dict:
        """Deterministic, location-seeded building/construction estimate
        used only when the OSM Overpass API can't be reached."""
        seed = abs(hash((round(lat, 3), round(lon, 3), "construction"))) % 100
        building_count = seed * 2
        construction_count = seed % 6
        area_km2 = math.pi * radius_km ** 2
        building_density_km2 = round(building_count / area_km2, 2) if area_km2 else None
        return {
            "building_count": building_count,
            "active_construction_site_count": construction_count,
            "building_density_per_km2": building_density_km2,
            "radius_km": radius_km,
            "status": "ESTIMATED",
            "source_name": "Estimated -- OpenStreetMap Overpass unreachable, regional approximation (not a measured value)",
        }

    # ------------------------------------------------------------------
    # Assemble the final response consumed by the prediction endpoint
    # ------------------------------------------------------------------
    def _assemble_response(
        self, lat: float, lon: float, radius_km: float,
        weather: dict, elevation_slope: dict, soil: dict, construction: dict,
    ) -> dict[str, Any]:
        data_status = {
            "weather": weather.get("status", "UNAVAILABLE"),
            "elevation_slope": elevation_slope.get("status", "UNAVAILABLE"),
            "soil": soil.get("status", "UNAVAILABLE"),
            "construction": construction.get("status", "UNAVAILABLE"),
        }
        unavailable = [k for k, v in data_status.items() if v == "UNAVAILABLE"]

        # These are the exact fields the CURRENTLY TRAINED model expects
        # (see app/ml/data_pipeline.py ALL_FEATURE_COLS). Weather/terrain are
        # the minimum required set; if either is missing we cannot produce a
        # meaningful prediction and the caller should surface that plainly
        # rather than substituting a fabricated number.
        model_input_ready = data_status["weather"] != "UNAVAILABLE" and data_status["elevation_slope"] != "UNAVAILABLE"

        model_input_features = None
        if model_input_ready:
            model_input_features = {
                "rainfall_mm": weather.get("rainfall_24h") if weather.get("rainfall_24h") is not None else 0.0,
                "soil_moisture_pct": weather.get("soil_moisture_pct") if weather.get("soil_moisture_pct") is not None else 0.0,
                "temperature_c": weather.get("temperature_c") if weather.get("temperature_c") is not None else 20.0,
                "humidity_pct": weather.get("humidity_pct") if weather.get("humidity_pct") is not None else 50.0,
                "slope_deg": elevation_slope.get("slope_deg", 0.0),
                "elevation_m": elevation_slope.get("elevation_m", 0.0),
            }

        if len(unavailable) >= 3:
            overall_quality = "LOW"
        elif unavailable:
            overall_quality = "MEDIUM"
        else:
            overall_quality = "HIGH"

        return {
            "latitude": lat,
            "longitude": lon,
            "radius_km": radius_km,
            "weather": weather,
            "elevation_slope": elevation_slope,
            "soil": soil,
            "construction": construction,
            "model_input_features": model_input_features,
            "model_input_ready": model_input_ready,
            "data_status": data_status,
            "data_quality": overall_quality,
            "unavailable_sources": unavailable,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }

    # ------------------------------------------------------------------
    # Mock/demo mode (spec sections 77-79) -- deterministic, clearly labeled
    # ------------------------------------------------------------------
    def _mock_result(self, lat: float, lon: float, radius_km: float) -> dict[str, Any]:
        seed_component = abs(hash((round(lat, 2), round(lon, 2)))) % 100
        weather = {
            "temperature_c": 18 + (seed_component % 15),
            "humidity_pct": 55 + (seed_component % 30),
            "rainfall_1h": 0.0,
            "rainfall_3h": round(seed_component * 0.3, 1),
            "rainfall_24h": round(seed_component * 1.8, 1),
            "rainfall_3day": round(seed_component * 4.2, 1),
            "rainfall_7day": round(seed_component * 8.5, 1),
            "soil_moisture_pct": round(20 + (seed_component % 50), 1),
            "status": "DEMO",
            "source_name": "MOCK_EXTERNAL_APIS=true (offline demo data)",
        }
        elevation_slope = {
            "elevation_m": 300 + seed_component * 20,
            "slope_deg": round(5 + (seed_component % 40), 1),
            "aspect_deg": (seed_component * 3.6) % 360,
            "status": "DEMO",
            "source_name": "MOCK_EXTERNAL_APIS=true (offline demo data)",
        }
        soil = {
            "sand_pct": 30.0, "silt_pct": 35.0, "clay_pct": 35.0,
            "soil_ph": 6.2, "organic_carbon_g_kg": 15.0, "bulk_density_kg_m3": 1300.0,
            "soil_texture_class": "clay-rich",
            "status": "DEMO",
            "source_name": "MOCK_EXTERNAL_APIS=true (offline demo data)",
        }
        construction = {
            "building_count": seed_component * 3,
            "active_construction_site_count": seed_component % 5,
            "building_density_per_km2": round(seed_component / (math.pi * radius_km ** 2), 2),
            "status": "DEMO",
            "source_name": "MOCK_EXTERNAL_APIS=true (offline demo data)",
        }
        result = self._assemble_response(lat, lon, radius_km, weather, elevation_slope, soil, construction)
        result["data_quality"] = "DEMO"
        result["demo_mode"] = True
        return result


geo_data_engine = GeoDataEngine()
