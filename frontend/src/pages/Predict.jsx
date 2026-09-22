import React, { useState } from "react";
import { Target, Loader2, MapPin, Sliders } from "lucide-react";
import {
  Card,
  SectionTitle,
  RiskBadge,
  ErrorState,
  Badge,
} from "../components/ui.jsx";
import Seo from "../components/Seo.jsx";
import MapPicker from "../components/MapPicker.jsx";
import { postPredict, postPredictLocation } from "../services/api.js";

const RADIUS_OPTIONS = [1, 3, 5, 10, 25];

const MANUAL_FIELDS = [
  { key: "rainfall_mm", label: "Rainfall (mm)", min: 0, max: 500, step: 1, default: 80 },
  { key: "soil_moisture_pct", label: "Soil Moisture (%)", min: 0, max: 100, step: 1, default: 55 },
  { key: "temperature_c", label: "Temperature (°C)", min: -10, max: 45, step: 0.5, default: 24 },
  { key: "humidity_pct", label: "Humidity (%)", min: 0, max: 100, step: 1, default: 65 },
  { key: "slope_deg", label: "Slope (°)", min: 0, max: 70, step: 1, default: 20 },
  { key: "elevation_m", label: "Elevation (m)", min: 0, max: 4500, step: 10, default: 500 },
  { key: "latitude", label: "Latitude", min: -90, max: 90, step: 0.01, default: 23.2 },
  { key: "longitude", label: "Longitude", min: -180, max: 180, step: 0.01, default: 77.4 },
];

function formatFeature(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function DataStatusPill({ status }) {
  const color =
    status === "LIVE" ? "emerald" : status === "CACHED" ? "cyan" : status === "DEMO" ? "amber" : "rose";
  return <Badge color={color}>{status || "UNKNOWN"}</Badge>;
}

function ResultPanel({ result, error, loading, placeholderText }) {
  return (
    <div className="space-y-6">
      {error && <ErrorState message={error} />}
      {!result && !error && !loading && (
        <Card>
          <p className="text-sm text-slate-500">{placeholderText}</p>
        </Card>
      )}
      {result && (
        <>
          <Card glow>
            <div className="flex items-center justify-between">
              <div>
                <RiskBadge level={result.risk_level} />
                <p className="mt-3 text-4xl font-extrabold text-slate-50">
                  {(result.landslide_probability * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500">landslide probability</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>
                  Model: <span className="text-slate-300">{result.model}</span>
                </p>
                <p>
                  Confidence:{" "}
                  <span className="text-slate-300">
                    {(result.prediction_confidence * 100).toFixed(1)}%
                  </span>
                </p>
              </div>
            </div>
          </Card>

          {result.data_sources && (
            <Card>
              <SectionTitle
                title="Live Environmental Snapshot"
                subtitle="Automatically retrieved for the selected location"
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <EnvCard label="Rainfall (24h)" value={fmt(result.data_sources.weather?.rainfall_24h, "mm")} status={result.data_sources.data_status?.weather} />
                <EnvCard label="Soil Moisture" value={fmt(result.data_sources.weather?.soil_moisture_pct, "%")} status={result.data_sources.data_status?.weather} />
                <EnvCard label="Temperature" value={fmt(result.data_sources.weather?.temperature_c, "°C")} status={result.data_sources.data_status?.weather} />
                <EnvCard label="Humidity" value={fmt(result.data_sources.weather?.humidity_pct, "%")} status={result.data_sources.data_status?.weather} />
                <EnvCard label="Slope" value={fmt(result.data_sources.elevation_slope?.slope_deg, "°")} status={result.data_sources.data_status?.elevation_slope} />
                <EnvCard label="Elevation" value={fmt(result.data_sources.elevation_slope?.elevation_m, "m")} status={result.data_sources.data_status?.elevation_slope} />
                <EnvCard label="Soil Texture" value={result.data_sources.soil?.soil_texture_class || "—"} status={result.data_sources.data_status?.soil} />
                <EnvCard label="Buildings Nearby" value={result.data_sources.construction?.building_count ?? "—"} status={result.data_sources.data_status?.construction} />
                <EnvCard label="Construction Sites" value={result.data_sources.construction?.active_construction_site_count ?? "—"} status={result.data_sources.data_status?.construction} />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Overall data quality:{" "}
                <span className="text-slate-300">{result.data_sources.data_quality}</span>
              </p>
            </Card>
          )}

          <Card>
            <SectionTitle title="Risk Drivers" subtitle="From the trained model's feature importances" />
            <div className="space-y-3">
              {result.risk_drivers.map((d) => (
                <div key={d.feature}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-400">{formatFeature(d.feature)}</span>
                    <span className="text-slate-500">{(d.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-base-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-blue"
                      style={{ width: `${Math.min(100, d.importance * 400)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function EnvCard({ label, value, status }) {
  return (
    <div className="rounded-xl border border-base-600 bg-base-800/40 p-3">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
        {status && <DataStatusPill status={status} />}
      </div>
      <p className="text-sm font-semibold text-slate-200">{value}</p>
    </div>
  );
}

function fmt(val, unit) {
  if (val === null || val === undefined) return "—";
  return `${val}${unit}`;
}

export default function Predict() {
  const [mode, setMode] = useState("location"); // "location" | "manual"

  // --- Location mode state ---
  const [selected, setSelected] = useState({ lat: null, lon: null });
  const [radiusKm, setRadiusKm] = useState(5);
  const [locResult, setLocResult] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState(null);

  const analyzeLocation = async () => {
    if (selected.lat == null || selected.lon == null) {
      setLocError("Select a location on the map or use your current location first.");
      return;
    }
    setLocLoading(true);
    setLocError(null);
    try {
      const res = await postPredictLocation({
        latitude: selected.lat,
        longitude: selected.lon,
        radius_km: radiusKm,
      });
      setLocResult(res);
    } catch (e) {
      setLocError(e.response?.data?.detail?.message || e.response?.data?.detail || e.message);
    } finally {
      setLocLoading(false);
    }
  };

  // --- Manual (legacy) mode state ---
  const [form, setForm] = useState(
    Object.fromEntries(MANUAL_FIELDS.map((f) => [f.key, f.default])),
  );
  const [triggerHint, setTriggerHint] = useState("rain");
  const [manualResult, setManualResult] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState(null);

  const updateManual = (key, val) => setForm((f) => ({ ...f, [key]: Number(val) }));

  const submitManual = async () => {
    setManualLoading(true);
    setManualError(null);
    try {
      const res = await postPredict({ ...form, trigger_hint: triggerHint });
      setManualResult(res);
    } catch (e) {
      setManualError(e.response?.data?.detail || e.message);
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Seo description="Get an ML-generated landslide risk prediction from TerraSense AI for any location, using live weather, terrain and soil data." />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-50">Analyze Location</h1>
          <p className="text-sm text-slate-500">
            Select a point and radius — TerraSense retrieves live environmental data automatically
          </p>
        </div>
        <div className="flex rounded-xl border border-base-600 bg-base-800/40 p-1 text-xs font-medium">
          <button
            onClick={() => setMode("location")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
              mode === "location" ? "bg-accent-cyan/15 text-accent-cyan" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" /> Live Location
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
              mode === "manual" ? "bg-accent-cyan/15 text-accent-cyan" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" /> Manual (Legacy)
          </button>
        </div>
      </div>

      {mode === "location" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <SectionTitle title="Select Location" subtitle="Click the map, drag the marker, or use your GPS" />
            <MapPicker
              latitude={selected.lat}
              longitude={selected.lon}
              radiusKm={radiusKm}
              onChange={(lat, lon) => setSelected({ lat, lon })}
            />

            <div className="mt-5">
              <label className="mb-2 block text-xs font-medium text-slate-400">Analysis Radius</label>
              <div className="flex flex-wrap gap-2">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadiusKm(r)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      radiusKm === r
                        ? "border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan"
                        : "border-base-600 bg-base-800/40 text-slate-400 hover:border-base-500"
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={analyzeLocation}
              disabled={locLoading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-4 py-3 text-sm font-semibold text-base-950 shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {locLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              ANALYZE RISK
            </button>
          </Card>

          <ResultPanel
            result={locResult}
            error={locError}
            loading={locLoading}
            placeholderText="Select a location and hit Analyze to see live environmental data and the ML risk assessment here."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <SectionTitle
              title="Environmental Conditions"
              subtitle="Legacy manual entry — kept for testing/demo only. Prefer Live Location above."
            />
            <div className="grid grid-cols-2 gap-4">
              {MANUAL_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-xs font-medium text-slate-400">{f.label}</label>
                  <input
                    type="number"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={form[f.key]}
                    onChange={(e) => updateManual(f.key, e.target.value)}
                    className="w-full rounded-lg border border-base-600 bg-base-800/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent-cyan/50"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-400">Primary Trigger</label>
                <select
                  value={triggerHint}
                  onChange={(e) => setTriggerHint(e.target.value)}
                  className="w-full rounded-lg border border-base-600 bg-base-800/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent-cyan/50"
                >
                  <option value="rain">Rain / Storm</option>
                  <option value="seismic">Seismic</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <button
              onClick={submitManual}
              disabled={manualLoading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-4 py-3 text-sm font-semibold text-base-950 shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {manualLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              PREDICT RISK
            </button>
          </Card>

          <ResultPanel
            result={manualResult}
            error={manualError}
            loading={manualLoading}
            placeholderText="Submit the form to see the ML prediction, probability, and risk drivers here."
          />
        </div>
      )}
    </div>
  );
}
