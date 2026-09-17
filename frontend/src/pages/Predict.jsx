import React, { useState } from "react";
import { Target, Loader2 } from "lucide-react";
import {
  Card,
  SectionTitle,
  RiskBadge,
  ErrorState,
} from "../components/ui.jsx";
import Seo from "../components/Seo.jsx";
import { postPredict } from "../services/api.js";

const FIELDS = [
  {
    key: "rainfall_mm",
    label: "Rainfall (mm)",
    min: 0,
    max: 500,
    step: 1,
    default: 80,
  },
  {
    key: "soil_moisture_pct",
    label: "Soil Moisture (%)",
    min: 0,
    max: 100,
    step: 1,
    default: 55,
  },
  {
    key: "temperature_c",
    label: "Temperature (°C)",
    min: -10,
    max: 45,
    step: 0.5,
    default: 24,
  },
  {
    key: "humidity_pct",
    label: "Humidity (%)",
    min: 0,
    max: 100,
    step: 1,
    default: 65,
  },
  {
    key: "slope_deg",
    label: "Slope (°)",
    min: 0,
    max: 70,
    step: 1,
    default: 20,
  },
  {
    key: "elevation_m",
    label: "Elevation (m)",
    min: 0,
    max: 4500,
    step: 10,
    default: 500,
  },
  {
    key: "latitude",
    label: "Latitude",
    min: -90,
    max: 90,
    step: 0.01,
    default: 23.2,
  },
  {
    key: "longitude",
    label: "Longitude",
    min: -180,
    max: 180,
    step: 0.01,
    default: 77.4,
  },
];

export default function Predict() {
  const [form, setForm] = useState(
    Object.fromEntries(FIELDS.map((f) => [f.key, f.default])),
  );
  const [triggerHint, setTriggerHint] = useState("rain");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: Number(val) }));

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await postPredict({ ...form, trigger_hint: triggerHint });
      setResult(res);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Seo description="Get an ML-generated landslide risk prediction from TerraSense AI by entering environmental conditions." />
      <div>
        <h1 className="text-xl font-bold text-slate-50">Risk Prediction</h1>
        <p className="text-sm text-slate-500">
          Enter environmental conditions to get an ML-generated risk assessment
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Environmental Conditions" />
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-slate-400">
                  {f.label}
                </label>
                <input
                  type="number"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={form[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                  className="w-full rounded-lg border border-base-600 bg-base-800/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent-cyan/50"
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Primary Trigger
              </label>
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
            onClick={submit}
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-4 py-3 text-sm font-semibold text-base-950 shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Target className="h-4 w-4" />
            )}
            PREDICT RISK
          </button>
        </Card>

        <div className="space-y-6">
          {error && <ErrorState message={error} />}
          {!result && !error && (
            <Card>
              <p className="text-sm text-slate-500">
                Submit the form to see the ML prediction, probability, and risk
                drivers here.
              </p>
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
                    <p className="text-xs text-slate-500">
                      landslide probability
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>
                      Model:{" "}
                      <span className="text-slate-300">{result.model}</span>
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

              <Card>
                <SectionTitle
                  title="Risk Drivers"
                  subtitle="From the trained model's feature importances"
                />
                <div className="space-y-3">
                  {result.risk_drivers.map((d) => (
                    <div key={d.feature}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-slate-400">
                          {formatFeature(d.feature)}
                        </span>
                        <span className="text-slate-500">
                          {(d.importance * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-base-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-blue"
                          style={{
                            width: `${Math.min(100, d.importance * 400)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <p className="text-xs leading-relaxed text-slate-500">
                  {result.data_provenance.note}
                </p>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatFeature(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
