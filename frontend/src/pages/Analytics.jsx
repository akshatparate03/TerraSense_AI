import React, { useEffect, useState } from "react";
import {
  Card,
  SectionTitle,
  LoadingSkeleton,
  ErrorState,
} from "../components/ui.jsx";
import Seo from "../components/Seo.jsx";
import { getDatasetAnalytics, getCorrelationMatrix } from "../services/api.js";
import InteractiveCorrelationHeatmap from "../components/InteractiveCorrelationHeatmap.jsx";
import { humanize } from "../utils/format.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDatasetAnalytics()
      .then(setData)
      .catch((e) => setError(e.message));
    getCorrelationMatrix()
      .then(setCorrelation)
      .catch(() => {});
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingSkeleton className="h-64" />;

  const monthly = Object.entries(data.monthly_distribution).map(([m, v]) => ({
    month: MONTH_NAMES[+m - 1] || m,
    count: v,
  }));
  const countries = Object.entries(data.country_distribution_top15).map(
    ([name, value]) => ({ name, value }),
  );
  const categories = Object.entries(data.category_distribution).map(
    ([name, value]) => ({ name: humanize(name), value }),
  );

  return (
    <div className="space-y-6">
      <Seo description="TerraSense AI data science analytics dashboard — descriptive statistics, seasonal trends, and correlations from the real NASA Global Landslide Catalog." />
      <div>
        <h1 className="text-xl font-bold text-slate-50">Analytics</h1>
        <p className="text-sm text-slate-500">
          Descriptive statistics over the full Global Landslide Catalog (
          {data.total_events.toLocaleString()} events)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total Events" value={data.total_events.toLocaleString()} />
        <Stat
          label="Rain-Triggered"
          value={`${(data.trigger_rain_fraction * 100).toFixed(1)}%`}
        />
        <Stat
          label="Seismic-Triggered"
          value={`${(data.trigger_seismic_fraction * 100).toFixed(1)}%`}
        />
        <Stat
          label="Avg. Fatalities/Event"
          value={
            data.fatality_count_describe.mean != null
              ? data.fatality_count_describe.mean.toFixed(2)
              : "—"
          }
        />
      </div>

      <Card>
        <SectionTitle
          title="Seasonal / Monthly Trend"
          subtitle="Real event dates from the catalog"
        />
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={monthly}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1b2333"
              vertical={false}
            />
            <XAxis
              dataKey="month"
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
            <Line
              type="monotone"
              dataKey="count"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Top Countries" />
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={countries} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1b2333"
                horizontal={false}
              />
              <XAxis type="number" stroke="#64748b" fontSize={11} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#64748b"
                fontSize={10}
                width={110}
              />
              <Tooltip
                contentStyle={{
                  background: "#0d1117",
                  border: "1px solid #1b2333",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle title="Category Breakdown" />
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={categories}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1b2333"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={9}
                angle={-30}
                textAnchor="end"
                height={70}
              />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#0d1117",
                  border: "1px solid #1b2333",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="value" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Feature Correlation Heatmap"
          subtitle="Training feature set (real + documented simulated features) — interactive, hover any cell"
        />
        {correlation ? (
          <InteractiveCorrelationHeatmap data={correlation} />
        ) : (
          <LoadingSkeleton className="h-64" />
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <Card hover={false}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-100">{value}</p>
    </Card>
  );
}
