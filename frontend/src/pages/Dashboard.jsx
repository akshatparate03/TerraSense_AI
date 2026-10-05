import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Gauge,
  MapPin,
  Percent,
  Activity,
  Clock,
  Database,
} from "lucide-react";
import {
  Card,
  KpiCard,
  LoadingSkeleton,
  SectionTitle,
  RiskBadge,
  ErrorState,
} from "../components/ui.jsx";
import Seo from "../components/Seo.jsx";
import TerrainVisualization from "../components/TerrainVisualization.jsx";
import {
  getDashboardSummary,
  getDatasetAnalytics,
  getActiveAlerts,
  getMyPredictionPoints,
} from "../services/api.js";
import { titleCase, humanize } from "../utils/format.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = [
  "#22d3ee",
  "#3b82f6",
  "#34d399",
  "#f59e0b",
  "#f43f5e",
  "#a78bfa",
  "#64748b",
];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [myPoints, setMyPoints] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getDashboardSummary(),
      getDatasetAnalytics(),
      getActiveAlerts(),
    ])
      .then(([s, a, al]) => {
        if (!mounted) return;
        setSummary(s);
        setAnalytics(a);
        setAlerts(al.items.slice(0, 5));
      })
      .catch((e) => setError(e.message));
    // The user's own predicted locations for the 3D terrain. Loaded
    // separately so a failure here never blocks the rest of the dashboard.
    getMyPredictionPoints()
      .then((d) => mounted && setMyPoints(d))
      .catch(() => mounted && setMyPoints({ points: [], counts: {}, total: 0 }));
    return () => {
      mounted = false;
    };
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!summary) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const sizeData = analytics
    ? Object.entries(analytics.size_distribution).map(([name, value]) => ({
        name,
        value,
      }))
    : [];
  const categoryData = analytics
    ? Object.entries(analytics.category_distribution)
        .slice(0, 6)
        .map(([name, value]) => ({ name: humanize(name), value }))
    : [];

  return (
    <div className="space-y-8">
      <Seo description="TerraSense AI dashboard — real-time ML landslide risk KPIs, alerts, and historical event distributions, backed by PostgreSQL." />
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-50 md:text-3xl">
          TerraSense AI
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Sense the Earth. Predict the Risk.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Total Predictions"
          value={summary.total_predictions}
          accent="cyan"
          icon={Database}
        />
        <KpiCard
          label="Alerts Triggered"
          value={summary.alerts_triggered}
          accent="rose"
          icon={AlertTriangle}
        />
        <KpiCard
          label="Active Alerts"
          value={summary.active_alerts}
          accent="rose"
          icon={AlertTriangle}
        />
        <KpiCard
          label="Locations Monitored"
          value={summary.monitored_locations}
          accent="cyan"
          icon={MapPin}
        />
        <KpiCard
          label="Latest Model Accuracy"
          value={
            summary.active_model_accuracy
              ? `${(summary.active_model_accuracy * 100).toFixed(1)}%`
              : "—"
          }
          accent="emerald"
          icon={Gauge}
        />
        <KpiCard
          label="Last Update"
          value={
            summary.last_update
              ? new Date(summary.last_update).toLocaleTimeString()
              : "—"
          }
          accent="cyan"
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle title="Active Alerts" />
          {alerts.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-base-600 p-6 text-sm text-slate-500">
              <Activity className="h-5 w-5 text-slate-600" />
              No active alerts — run a prediction or start the live simulation
              to generate one.
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-xl border border-base-700/60 bg-base-800/40 p-3"
                >
                  <div className="flex items-center gap-3">
                    <RiskBadge
                      level={
                        a.alert_level === "WARNING" ? "MEDIUM" : a.alert_level
                      }
                    />
                    <div>
                      <p className="text-sm text-slate-200">
                        {a.location_name || "Unknown location"}
                      </p>
                      <p className="text-xs text-slate-500">{a.title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-200">
                      {(a.risk_probability * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(a.triggered_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle title="Landslide Size Distribution" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={sizeData}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={3}
              >
                {sizeData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#0d1117",
                  border: "1px solid #1b2333",
                  borderRadius: 8,
                }}
                itemStyle={{ color: "#f1f5f9" }}
                labelStyle={{ color: "#f1f5f9" }}
                formatter={(value, name) => [
                  value.toLocaleString(),
                  titleCase(name),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Your Predicted Locations — 3D Terrain"
          subtitle="Only the places you have run a prediction for (from any page). Green = low, yellow = medium, red = high risk."
        />
        <TerrainVisualization
          points={(myPoints?.points || []).map((p) => ({
            id: p.location_id,
            name: `${p.name} · ${(p.probability * 100).toFixed(0)}%`,
            latitude: p.latitude,
            longitude: p.longitude,
            level: p.risk_level,
          }))}
          emptyMessage={
            myPoints
              ? "No predictions yet. Run a prediction on the Risk Prediction page and your locations will appear here."
              : "Loading your locations..."
          }
          labelLimit={20}
        />
        {myPoints?.total > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            {myPoints.total} location{myPoints.total === 1 ? "" : "s"} ·{" "}
            <span className="text-red-600">{myPoints.counts.HIGH || 0} high</span>
            {" · "}
            <span className="text-yellow-600">{myPoints.counts.MEDIUM || 0} medium</span>
            {" · "}
            <span className="text-green-600">{myPoints.counts.LOW || 0} low</span>
            {" — latest result per location"}
          </p>
        )}
      </Card>

      <Card>
        <SectionTitle title="Landslide Category Frequency" />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={categoryData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1b2333"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
            />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "#0d1117",
                border: "1px solid #1b2333",
                borderRadius: 8,
              }}
            />
            <Bar dataKey="value" fill="#22d3ee" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
