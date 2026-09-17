import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function InteractivePrecisionRecallCurve({ data }) {
  if (!data?.points) return null;

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data.points} margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1b2333" />
          <XAxis
            dataKey="recall"
            type="number"
            domain={[0, 1]}
            stroke="#64748b"
            fontSize={11}
            label={{
              value: "Recall",
              position: "insideBottom",
              offset: -5,
              fill: "#64748b",
              fontSize: 11,
            }}
          />
          <YAxis
            dataKey="precision"
            type="number"
            domain={[0, 1]}
            stroke="#64748b"
            fontSize={11}
            label={{
              value: "Precision",
              angle: -90,
              position: "insideLeft",
              fill: "#64748b",
              fontSize: 11,
            }}
          />
          <Tooltip
            contentStyle={{
              background: "#0d1117",
              border: "1px solid #1b2333",
              borderRadius: 8,
            }}
            formatter={(value) => [Number(value).toFixed(3), "Precision"]}
            labelFormatter={(v) => `Recall: ${Number(v).toFixed(3)}`}
          />
          <Line
            type="monotone"
            dataKey="precision"
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-2 text-center text-xs text-slate-500">
        {data.model} — Precision vs. Recall across all thresholds
      </p>
    </div>
  );
}
