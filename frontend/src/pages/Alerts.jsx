import React, { useEffect, useState } from "react";
import { AlertTriangle, Check, CheckCheck } from "lucide-react";
import {
  Card,
  SectionTitle,
  RiskBadge,
  Badge,
  EmptyState,
  LoadingSkeleton,
} from "../components/ui.jsx";
import Seo from "../components/Seo.jsx";
import { getAlerts, updateAlertStatus } from "../services/api.js";

const STATUS_COLOR = {
  ACTIVE: "rose",
  ACKNOWLEDGED: "amber",
  RESOLVED: "emerald",
};

export default function Alerts() {
  const [alerts, setAlerts] = useState(null);
  const [filter, setFilter] = useState("");

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
                </p>
                <p className="mt-2 text-[11px] italic text-slate-600">
                  {a.note}
                </p>
                <div className="mt-3 flex gap-2">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
