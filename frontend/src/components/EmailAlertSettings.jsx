import React, { useEffect, useState } from "react";
import { Mail, MapPin, Power, Send, Loader2 } from "lucide-react";
import { Card, SectionTitle, Badge } from "./ui.jsx";
import MapPicker from "./MapPicker.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getMonitoringStatus,
  startMonitoring,
  stopMonitoring,
  sendTestAlert,
} from "../services/api.js";

const STATE_COLOR = { NORMAL: "emerald", ALERTED: "rose" };

function SubscriptionRow({ sub, onStop, onTest, busyId }) {
  return (
    <div className="rounded-xl border border-base-700/60 bg-base-800/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-accent-cyan" />
          <span className="text-sm font-medium text-slate-200">{sub.label}</span>
          <Badge color={STATE_COLOR[sub.alert_state] || "slate"}>{sub.alert_state}</Badge>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onTest(sub.id)}
            disabled={busyId === sub.id}
            className="flex items-center gap-1.5 rounded-lg border border-base-600 bg-base-800/60 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-accent-cyan/50 disabled:opacity-50"
          >
            {busyId === sub.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Send Test
          </button>
          <button
            onClick={() => onStop(sub.id)}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/20"
          >
            <Power className="h-3 w-3" /> Disable
          </button>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 sm:grid-cols-4">
        <span>
          {sub.latitude.toFixed(3)}, {sub.longitude.toFixed(3)}
        </span>
        <span>Radius: {sub.radius_km} km</span>
        <span>Alert ≥ {(sub.alert_threshold * 100).toFixed(0)}%</span>
        <span>
          Last check:{" "}
          {sub.last_probability != null
            ? `${(sub.last_probability * 100).toFixed(0)}%`
            : "pending"}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-600">Alerts sent to {sub.email}</p>
    </div>
  );
}

export default function EmailAlertSettings() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [testBusyId, setTestBusyId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [selected, setSelected] = useState({ lat: null, lon: null });
  const [radiusKm, setRadiusKm] = useState(5);
  const [threshold, setThreshold] = useState(65);
  const [submitting, setSubmitting] = useState(false);

  const load = () => getMonitoringStatus().then(setStatus).catch((e) => setError(e.message));

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  const submit = async () => {
    if (selected.lat == null) {
      setError("Pick a location on the map first.");
      return;
    }
    if (!email) {
      setError("Enter an email address for alerts.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await startMonitoring({
        label: label || `Monitored location (${selected.lat.toFixed(2)}, ${selected.lon.toFixed(2)})`,
        email,
        latitude: selected.lat,
        longitude: selected.lon,
        radius_km: radiusKm,
        alert_threshold: threshold / 100,
      });
      setShowForm(false);
      setSelected({ lat: null, lon: null });
      setLabel("");
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStop = async (id) => {
    await stopMonitoring(id);
    await load();
  };

  const handleTest = async (id) => {
    setTestBusyId(id);
    try {
      const res = await sendTestAlert(id);
      if (res.status === "ok") {
        setError(null);
      } else {
        setError(res.message || `Test check returned status: ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setTestBusyId(null);
    }
  };

  const activeSubs = (status?.subscriptions || []).filter((s) => s.is_active);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionTitle
          title="Email Alert Monitoring"
          subtitle={
            status
              ? `Background checks every ${status.check_interval_minutes} minutes${
                  status.monitoring_enabled_globally ? "" : " (disabled server-side)"
                }`
              : "Loading..."
          }
        />
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent-cyan to-accent-blue px-3 py-1.5 text-xs font-semibold text-base-950"
        >
          <Mail className="h-3.5 w-3.5" />
          {showForm ? "Cancel" : "Enable Alerts"}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}

      {showForm && (
        <div className="mt-4 space-y-4 rounded-xl border border-base-600 bg-base-800/30 p-4">
          <MapPicker
            latitude={selected.lat}
            longitude={selected.lon}
            radiusKm={radiusKm}
            onChange={(lat, lon) => setSelected({ lat, lon })}
            height="300px"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Label</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Home, Shimla"
                className="w-full rounded-lg border border-base-600 bg-base-800/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent-cyan/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Alert Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-base-600 bg-base-800/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent-cyan/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Radius: {radiusKm} km</label>
              <input
                type="range"
                min={1}
                max={25}
                step={1}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Alert Threshold: {threshold}%
              </label>
              <input
                type="range"
                min={30}
                max={95}
                step={5}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-4 py-2.5 text-sm font-semibold text-base-950 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Start Monitoring This Location
          </button>
          <p className="text-xs text-slate-500">
            You'll get an email if the estimated risk here crosses {threshold}%, at most once per
            cooldown window, until risk drops back down and re-arms.
          </p>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {activeSubs.length === 0 && !showForm && (
          <p className="text-sm text-slate-500">
            No locations are currently monitored. Click "Enable Alerts" to get emailed if risk rises
            near a place you care about.
          </p>
        )}
        {activeSubs.map((sub) => (
          <SubscriptionRow key={sub.id} sub={sub} onStop={handleStop} onTest={handleTest} busyId={testBusyId} />
        ))}
      </div>
    </Card>
  );
}
