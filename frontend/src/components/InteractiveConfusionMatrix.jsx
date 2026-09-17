import React, { useState } from "react";

export default function InteractiveConfusionMatrix({ data }) {
  const [hovered, setHovered] = useState(null);
  if (!data?.matrix) return null;

  const { matrix, labels, tp, tn, fp, fn } = data;
  const total = tp + tn + fp + fn;
  const max = Math.max(...matrix.flat());

  const cells = [
    {
      row: 0,
      col: 0,
      value: tn,
      label: "True Negative",
      desc: "Correctly predicted: no landslide",
    },
    {
      row: 0,
      col: 1,
      value: fp,
      label: "False Positive",
      desc: "Predicted landslide, but none occurred",
    },
    {
      row: 1,
      col: 0,
      value: fn,
      label: "False Negative",
      desc: "Missed an actual landslide",
    },
    {
      row: 1,
      col: 1,
      value: tp,
      label: "True Positive",
      desc: "Correctly predicted: landslide",
    },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-[auto_1fr_1fr] gap-1 text-xs">
        <div />
        <div className="pb-1 text-center font-medium text-slate-400">
          {labels?.[0] || "Pred: No"}
        </div>
        <div className="pb-1 text-center font-medium text-slate-400">
          {labels?.[1] || "Pred: Yes"}
        </div>

        <div className="flex items-center justify-center pr-2 font-medium text-slate-400 [writing-mode:vertical-rl]">
          {labels?.[0] || "Actual: No"}
        </div>
        <Cell
          cell={cells[0]}
          max={max}
          total={total}
          hovered={hovered}
          setHovered={setHovered}
        />
        <Cell
          cell={cells[1]}
          max={max}
          total={total}
          hovered={hovered}
          setHovered={setHovered}
        />

        <div className="flex items-center justify-center pr-2 font-medium text-slate-400 [writing-mode:vertical-rl]">
          {labels?.[1] || "Actual: Yes"}
        </div>
        <Cell
          cell={cells[2]}
          max={max}
          total={total}
          hovered={hovered}
          setHovered={setHovered}
        />
        <Cell
          cell={cells[3]}
          max={max}
          total={total}
          hovered={hovered}
          setHovered={setHovered}
        />
      </div>

      <div className="h-10 text-center text-xs text-slate-500">
        {hovered ? (
          <>
            <span className="font-semibold text-slate-200">
              {hovered.label}:
            </span>{" "}
            {hovered.value.toLocaleString()} (
            {((hovered.value / total) * 100).toFixed(1)}%) — {hovered.desc}
          </>
        ) : (
          `Hover a cell for details — ${data.model}, ${total.toLocaleString()} test samples`
        )}
      </div>
    </div>
  );
}

function Cell({ cell, max, total, hovered, setHovered }) {
  const intensity = cell.value / max;
  const isHovered = hovered === cell;
  return (
    <div
      onMouseEnter={() => setHovered(cell)}
      onMouseLeave={() => setHovered(null)}
      style={{
        backgroundColor: `rgba(34, 211, 238, ${0.12 + intensity * 0.6})`,
      }}
      className={`flex h-20 w-24 cursor-default flex-col items-center justify-center rounded-lg border transition-all sm:h-24 sm:w-28 ${
        isHovered
          ? "scale-105 border-accent-cyan shadow-glow"
          : "border-base-700/60"
      }`}
    >
      <span className="text-xl font-bold text-slate-100">
        {cell.value.toLocaleString()}
      </span>
      <span className="text-[10px] text-slate-400">
        {((cell.value / total) * 100).toFixed(1)}%
      </span>
    </div>
  );
}
