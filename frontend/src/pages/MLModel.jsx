import React, { useEffect, useState } from "react";
import {
  Card,
  SectionTitle,
  Badge,
  LoadingSkeleton,
  ErrorState,
} from "../components/ui.jsx";
import Seo from "../components/Seo.jsx";
import { humanize } from "../utils/format.js";
import InteractiveConfusionMatrix from "../components/InteractiveConfusionMatrix.jsx";
import InteractiveRocCurve from "../components/InteractiveRocCurve.jsx";
import InteractivePrecisionRecallCurve from "../components/InteractivePrecisionRecallCurve.jsx";
import {
  getModelInfo,
  getModelMetrics,
  getModelFeatures,
  getConfusionMatrix,
  getRocCurve,
  getPrecisionRecallCurve,
} from "../services/api.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export default function MLModel() {
  const [info, setInfo] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [features, setFeatures] = useState(null);
  const [confusion, setConfusion] = useState(null);
  const [roc, setRoc] = useState(null);
  const [pr, setPr] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getModelInfo(),
      getModelMetrics(),
      getModelFeatures(),
      getConfusionMatrix(),
      getRocCurve(),
      getPrecisionRecallCurve(),
    ])
      .then(([i, m, f, cm, r, p]) => {
        setInfo(i);
        setMetrics(m);
        setFeatures(f.feature_importance);
        setConfusion(cm);
        setRoc(r);
        setPr(p);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!info) return <LoadingSkeleton className="h-64" />;

  const comparisonData = metrics
    ? Object.entries(metrics.all_model_comparison).map(([name, m]) => ({
        name,
        accuracy: +(m.accuracy * 100).toFixed(1),
        f1: +(m.f1_score * 100).toFixed(1),
        roc_auc: +(m.roc_auc * 100).toFixed(1),
      }))
    : [];

  const featureData = features
    ? Object.entries(features).map(([name, value]) => ({
        name: humanize(name),
        value: +(value * 100).toFixed(2),
      }))
    : [];

  const sel = metrics?.selected_model_metrics;

  return (
    <div className="space-y-6">
      <Seo description="TerraSense AI machine learning model page — real accuracy, precision, recall, F1, ROC-AUC and feature importance from the trained pipeline." />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-50">ML Model</h1>
          <p className="text-sm text-slate-500">
            Trained pipeline evaluation — all numbers come from the actual
            training run
          </p>
        </div>
        <Badge color="emerald">{info.selected_model}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Metric label="Accuracy" value={sel?.accuracy} />
        <Metric label="Precision" value={sel?.precision} />
        <Metric label="Recall" value={sel?.recall} />
        <Metric label="F1 Score" value={sel?.f1_score} />
        <Metric label="ROC-AUC" value={sel?.roc_auc} />
      </div>

      <Card>
        <SectionTitle
          title="Model Comparison"
          subtitle={`${info.candidates_evaluated?.length || 0} candidate models trained and evaluated — hover any bar`}
        />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={comparisonData}>
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
            <Legend />
            <Bar dataKey="accuracy" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            <Bar dataKey="f1" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="roc_auc" fill="#34d399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Feature Importance"
            subtitle="Selected model — hover any bar"
          />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={featureData}
              layout="vertical"
              margin={{ left: 40 }}
            >
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
              <Bar dataKey="value" fill="#22d3ee" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle title="Training Details" />
          <div className="space-y-2 text-sm">
            <Row label="Dataset version" value={info.dataset_version} />
            <Row label="Training samples" value={info.training_samples} />
            <Row label="Testing samples" value={info.testing_samples} />
            <Row
              label="Trained at"
              value={
                info.trained_at
                  ? new Date(info.trained_at).toLocaleString()
                  : "—"
              }
            />
            <Row
              label="Candidates evaluated"
              value={info.candidates_evaluated?.join(", ")}
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <SectionTitle
            title="Confusion Matrix"
            subtitle="Interactive — hover a cell"
          />
          <InteractiveConfusionMatrix data={confusion} />
        </Card>
        <Card>
          <SectionTitle
            title="ROC Curve"
            subtitle="Interactive — hover the line"
          />
          <InteractiveRocCurve data={roc} />
        </Card>
        <Card>
          <SectionTitle
            title="Precision-Recall Curve"
            subtitle="Interactive — hover the line"
          />
          <InteractivePrecisionRecallCurve data={pr} />
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <Card hover={false}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-accent-cyan">
        {value != null ? `${(value * 100).toFixed(1)}%` : "—"}
      </p>
    </Card>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-base-700/40 pb-2 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-300">{value ?? "—"}</span>
    </div>
  );
}
