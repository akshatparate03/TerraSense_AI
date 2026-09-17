import React, { useState } from "react";
import { humanize } from "../utils/format.js";

function colorFor(value) {
  // -1 (blue) -> 0 (dark) -> +1 (red), matching the app's palette
  if (value >= 0) {
    const a = 0.15 + value * 0.75;
    return `rgba(244, 63, 94, ${a})`;
  }
  const a = 0.15 + Math.abs(value) * 0.75;
  return `rgba(59, 130, 246, ${a})`;
}

export default function InteractiveCorrelationHeatmap({ data }) {
  const [hovered, setHovered] = useState(null);
  if (!data?.matrix || !data?.columns) return null;

  const { columns, matrix } = data;
  const n = columns.length;
  const cellSize = Math.max(26, Math.min(42, Math.floor(560 / n)));

  return (
    <div className="flex flex-col items-center gap-3 overflow-x-auto">
      <div className="inline-block">
        <div className="flex" style={{ marginLeft: 140 }}>
          {columns.map((c) => (
            <div
              key={c}
              style={{ width: cellSize }}
              className="flex h-24 items-end justify-center overflow-visible text-[9px] text-slate-500"
            >
              <span className="origin-bottom-left -rotate-45 whitespace-nowrap">
                {humanize(c)}
              </span>
            </div>
          ))}
        </div>
        {matrix.map((row, i) => (
          <div key={i} className="flex items-center">
            <div className="w-[140px] shrink-0 pr-2 text-right text-[10px] text-slate-500">
              {humanize(columns[i])}
            </div>
            {row.map((value, j) => (
              <div
                key={j}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: colorFor(value),
                }}
                onMouseEnter={() =>
                  setHovered({
                    row: humanize(columns[i]),
                    col: humanize(columns[j]),
                    value,
                  })
                }
                onMouseLeave={() => setHovered(null)}
                className={`flex cursor-default items-center justify-center border border-base-950/40 text-[9px] font-medium text-slate-100 transition-transform ${
                  hovered?.row === columns[i] && hovered?.col === columns[j]
                    ? "z-10 scale-125 ring-2 ring-white/60"
                    : ""
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="h-8 text-center text-xs text-slate-500">
        {hovered ? (
          <>
            <span className="font-semibold text-slate-200">{hovered.row}</span>{" "}
            vs{" "}
            <span className="font-semibold text-slate-200">{hovered.col}</span>:{" "}
            {hovered.value.toFixed(3)}
          </>
        ) : (
          "Hover any cell to see the exact correlation value"
        )}
      </div>
    </div>
  );
}
