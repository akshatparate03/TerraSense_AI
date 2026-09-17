import React, { useEffect, useState } from "react";
import { Plus, Trash2, MapPin, Loader2 } from "lucide-react";
import {
  Card,
  SectionTitle,
  RiskBadge,
  LoadingSkeleton,
  EmptyState,
  Badge,
} from "../components/ui.jsx";
import Seo from "../components/Seo.jsx";
import {
  getLocations,
  createLocation,
  deleteLocation,
} from "../services/api.js";

const EMPTY_FORM = {
  name: "",
  region: "",
  country: "",
  latitude: "",
  longitude: "",
  elevation: "",
};

export default function Locations() {
  const [locations, setLocations] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = () => getLocations().then((d) => setLocations(d.items));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createLocation({
        name: form.name,
        region: form.region || null,
        country: form.country || null,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        elevation: form.elevation ? parseFloat(form.elevation) : null,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create location.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await deleteLocation(id);
    load();
  };

  return (
    <div className="space-y-6">
      <Seo description="Manage TerraSense AI monitoring locations backed by PostgreSQL — add, view, and remove landslide risk monitoring points." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-50">Manage Locations</h1>
          <p className="text-sm text-slate-500">
            Monitoring locations, persisted in PostgreSQL (locations table)
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 rounded-xl bg-accent-cyan/10 px-4 py-2 text-sm font-medium text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/20"
        >
          <Plus className="h-4 w-4" /> Add Location
        </button>
      </div>

      {showForm && (
        <Card>
          <SectionTitle title="New Location" />
          <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <Input
              label="Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              required
            />
            <Input
              label="Region"
              value={form.region}
              onChange={(v) => setForm({ ...form, region: v })}
            />
            <Input
              label="Country"
              value={form.country}
              onChange={(v) => setForm({ ...form, country: v })}
            />
            <Input
              label="Latitude"
              value={form.latitude}
              onChange={(v) => setForm({ ...form, latitude: v })}
              type="number"
              required
            />
            <Input
              label="Longitude"
              value={form.longitude}
              onChange={(v) => setForm({ ...form, longitude: v })}
              type="number"
              required
            />
            <Input
              label="Elevation (m)"
              value={form.elevation}
              onChange={(v) => setForm({ ...form, elevation: v })}
              type="number"
            />
            {error && (
              <p className="sm:col-span-3 text-xs text-rose-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="sm:col-span-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-4 py-2.5 text-sm font-semibold text-base-950 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Save Location
            </button>
          </form>
        </Card>
      )}

      <Card>
        <SectionTitle
          title="Monitored Locations"
          subtitle={locations ? `${locations.length} locations` : ""}
        />
        {!locations ? (
          <LoadingSkeleton className="h-64" />
        ) : locations.length === 0 ? (
          <EmptyState
            title="No locations yet"
            subtitle="Add one above to get started."
            icon={MapPin}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="rounded-xl border border-base-700/60 bg-base-800/40 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-200">{loc.name}</p>
                    <p className="text-xs text-slate-500">
                      {[loc.region, loc.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(loc.id)}
                    className="text-slate-600 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {loc.latest_risk_level && (
                    <RiskBadge level={loc.latest_risk_level} />
                  )}
                  <Badge color="slate">
                    {loc.prediction_count} predictions
                  </Badge>
                  {loc.active_alert_count > 0 && (
                    <Badge color="rose">
                      {loc.active_alert_count} active alerts
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  {loc.latitude.toFixed(3)}, {loc.longitude.toFixed(3)}
                  {loc.elevation ? ` · ${loc.elevation}m elevation` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        step={type === "number" ? "any" : undefined}
        className="w-full rounded-lg border border-base-600 bg-base-800/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent-cyan/50"
      />
    </div>
  );
}
