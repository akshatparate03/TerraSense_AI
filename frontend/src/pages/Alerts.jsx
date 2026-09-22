import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { AlertTriangle, Check, CheckCheck, MapPin } from "lucide-react";
import {
  Card,
  SectionTitle,
  RiskBadge,
  Badge,
  EmptyState,
  LoadingSkeleton,
} from "../components/ui.jsx";
import Seo from "../components/Seo.jsx";
import EmailAlertSettings from "../components/EmailAlertSettings.jsx";
import { DARK_TILE_URL, DARK_TILE_LABELS_URL, TILE_ATTRIBUTION, TILE_MAX_ZOOM } from "../utils/mapTiles.js";
import { getAlerts, updateAlertStatus } from "../services/api.js";

const STATUS_COLOR = {
  ACTIVE: "rose",
  ACKNOWLEDGED: "amber",
  RESOLVED: "emerald",
};

const RISK_DOT_COLOR = { HIGH: "#f43f5e", MEDIUM: "#f59e0b", WARNING: "#f59e0b", LOW: "#34d399" };

export default function Alerts() {
  const [alerts, setAlerts] = useState(null);
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const load = () =>
    getAlerts({ limit: 100, status: filter || undefined }).then((d) =>
      setAlerts(d.items),
    );

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [filter]);

  const setStatus = async (id, status) => {
    await updateAlertStatus(id, status);
    load();
  };

  return (
    <div className="space-y-6">
      <Seo description="TerraSense AI early-warning alert center — active, acknowledged, and resolved landslide risk alerts, generated from real ML predictions and stored in PostgreSQL." />
      <div>
        <h1 className="text-xl font-bold text-slate-50">Alert Center</h1>
        <p className="text-sm text-slate-500">
          Generated whenever a prediction crosses the MEDIUM/HIGH probability
          threshold
        </p>
      </div>

      <EmailAlertSettings />

      <div className="flex gap-2">
        {["", "ACTIVE", "ACKNOWLEDGED", "RESOLVED"].map((s) => (
          <button
            key={s || "ALL"}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
              filter === s
                ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30"
                : "text-slate-400 border-base-600 hover:bg-base-800"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <Card>
        <SectionTitle title="Alert Feed" />
        {!alerts ? (
          <LoadingSkeleton className="h-64" />
        ) : alerts.length === 0 ? (
          <EmptyState
            title="No alerts"
            subtitle="Run a prediction or the live simulation to generate early-warning alerts."
            icon={AlertTriangle}
          />
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-base-700/60 bg-base-800/40 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="risk-blink-marker h-2 w-2 shrink-0"
                      style={{
                        backgroundColor:
                          RISK_DOT_COLOR[a.alert_level] || "#64748b",
                      }}
                    />
                    <RiskBadge
                      level={
                        a.alert_level === "WARNING" ? "MEDIUM" : a.alert_level
                      }
                    />
                    <Badge color={STATUS_COLOR[a.status] || "slate"}>
                      {a.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(a.triggered_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-200">{a.title}</p>
                <p className="mt-1 text-xs text-slate-500">{a.message}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Location: {a.location_name || "Unknown"}
                  {a.country ? `, ${a.country}` : ""}
                </p>
                <p className="mt-2 text-[11px] italic text-slate-600">
                  {a.note}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {a.status === "ACTIVE" && (
                    <button
                      onClick={() => setStatus(a.id, "ACKNOWLEDGED")}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 hover:bg-amber-500/20"
                    >
                      <Check className="h-3 w-3" /> Acknowledge
                    </button>
                  )}
                  {a.status !== "RESOLVED" && (
                    <button
                      onClick={() => setStatus(a.id, "RESOLVED")}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <CheckCheck className="h-3 w-3" /> Resolve
                    </button>
                  )}
                  {a.latitude != null && (
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === a.id ? null : a.id)
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-base-600 bg-base-800/60 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-accent-cyan/50"
                    >
                      <MapPin className="h-3 w-3" />
                      {expandedId === a.id ? "Hide Map" : "View on Map"}
                    </button>
                  )}
                </div>

                {expandedId === a.id && a.latitude != null && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-base-600">
                    <MapContainer
                      center={[a.latitude, a.longitude]}
                      zoom={9}
                      style={{ height: "260px", width: "100%" }}
                    >
                      <TileLayer attribution={TILE_ATTRIBUTION} url={DARK_TILE_URL} maxZoom={TILE_MAX_ZOOM} />
                      <TileLayer url={DARK_TILE_LABELS_URL} maxZoom={TILE_MAX_ZOOM} />
                      <CircleMarker
                        center={[a.latitude, a.longitude]}
                        radius={9}
                        pathOptions={{
                          color: RISK_DOT_COLOR[a.alert_level] || "#64748b",
                          fillColor: RISK_DOT_COLOR[a.alert_level] || "#64748b",
                          fillOpacity: 0.85,
                          className: "risk-blink-svg",
                        }}
                      >
                        <Popup>
                          {a.location_name}
                          <br />
                          {a.risk_probability != null
                            ? `${(a.risk_probability * 100).toFixed(1)}%`
                            : ""}
                        </Popup>
                      </CircleMarker>
                    </MapContainer>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
