import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

export default function InteractiveRocCurve({ data }) {
  if (!data?.points) return null;

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data.points} margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1b2333" />
          <XAxis
            dataKey="fpr"
            type="number"
            domain={[0, 1]}
            stroke="#64748b"
            fontSize={11}
            label={{
              value: "False Positive Rate",
              position: "insideBottom",
              offset: -5,
              fill: "#64748b",
              fontSize: 11,
            }}
          />
          <YAxis
            dataKey="tpr"
            type="number"
            domain={[0, 1]}
            stroke="#64748b"
            fontSize={11}
            label={{
              value: "True Positive Rate",
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
            formatter={(value, name) => [
              value.toFixed(3),
              name === "tpr" ? "True Positive Rate" : name,
            ]}
            labelFormatter={(v) =>
              `False Positive Rate: ${Number(v).toFixed(3)}`
            }
          />
          <ReferenceLine
            segment={[
              { x: 0, y: 0 },
              { x: 1, y: 1 },
            ]}
            stroke="#475569"
            strokeDasharray="4 4"
          />
          <Line
            type="monotone"
            dataKey="tpr"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-2 text-center text-xs text-slate-500">
        {data.model} — AUC ={" "}
        <span className="font-semibold text-accent-cyan">
          {data.auc?.toFixed(3)}
        </span>
      </p>
    </div>
  );
}
