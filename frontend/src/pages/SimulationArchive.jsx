import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { Card, SectionTitle, RiskBadge, Badge } from "../components/ui.jsx";
import Seo from "../components/Seo.jsx";
import {
  simulationStart,
  simulationPause,
  simulationResume,
  simulationStop,
  simulationReset,
  simulationSpeed,
  simulationFullHistory,
  wsMonitoringUrl,
} from "../services/api.js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Brush,
} from "recharts";

const SPEEDS = [0.5, 1, 2, 5, 10, 50];
const MAX_LIVE_POINTS = 40;

export default function SimulationArchive() {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [latest, setLatest] = useState(null);
  const [series, setSeries] = useState([]);
  const [fullHistory, setFullHistory] = useState(null);
  const wsRef = useRef(null);
  const seqRef = useRef(0);

  useEffect(() => {
    const ws = new WebSocket(wsMonitoringUrl());
    wsRef.current = ws;
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);

      if (msg.type === "simulation_completed") {
        setCompleted(true);
        setRunning(false);
        setPaused(false);
        loadFullHistory();
        return;
      }

      if (msg.prediction?.error) return;
      setLatest(msg);
      seqRef.current += 1;
      setSeries((prev) => {
        const next = [
          ...prev,
          {
            t: msg.index,
            rainfall: msg.observation.rainfall_mm,
            soil: msg.observation.soil_moisture_pct,
            probability: (msg.prediction.landslide_probability || 0) * 100,
          },
        ];
        return next.length > MAX_LIVE_POINTS
          ? next.slice(next.length - MAX_LIVE_POINTS)
          : next;
      });
    };
    return () => ws.close();
  }, []);

  const loadFullHistory = () => {
    simulationFullHistory().then((d) => setFullHistory(d.items));
  };

  useEffect(() => {
    // Load the full 1-500 record chart once on mount too, so it's browsable
    // even before starting a fresh run.
    loadFullHistory();
  }, []);

  const start = async () => {
    const status = await simulationStart(speed);
    setRunning(status.is_running);
    setPaused(status.is_paused);
    setCompleted(status.completed);
  };
  const pause = async () => {
    const s = await simulationPause();
    setPaused(s.is_paused);
  };
  const resume = async () => {
    const s = await simulationResume();
    setPaused(s.is_paused);
  };
  const stop = async () => {
    const s = await simulationStop();
    setRunning(s.is_running);
    setPaused(s.is_paused);
  };
  const reset = async () => {
    const s = await simulationReset();
    setSeries([]);
    setLatest(null);
    setRunning(s.is_running);
    setPaused(s.is_paused);
    setCompleted(s.completed);
    seqRef.current = 0;
  };
  const changeSpeed = async (s) => {
    setSpeed(s);
    if (running) await simulationSpeed(s);
  };

  const obs = latest?.observation;
  const pred = latest?.prediction;

  return (
    <div className="space-y-6">
      <Seo description="TerraSense AI simulation archive — replays 500 real landslide catalog records through the trained ML model. This is training/demo data, not a live risk feed." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-50">
            Simulation Archive
          </h1>
          <p className="text-sm text-slate-500">
            Replays 500 real historical catalog records through the model —
            useful for exploring how it behaves, NOT a live risk feed. For
            current risk at real locations, see{" "}
            <span className="text-accent-cyan">Live Risk Scan</span>.
          </p>
        </div>
        <Badge color={completed ? "emerald" : "cyan"}>
          <Radio className="h-3 w-3" />{" "}
          {completed
            ? "Completed (500/500)"
            : running
              ? paused
                ? "Paused"
                : "Streaming"
              : "Stopped"}
        </Badge>
      </div>

      {completed && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          Historical data simulation finished after 500 records. It will not
          restart automatically — press Reset to run again.
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={start}
            disabled={completed}
            className="flex items-center gap-2 rounded-xl bg-accent-cyan/10 px-4 py-2 text-sm font-medium text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/20 transition-colors disabled:opacity-40"
          >
            <Play className="h-4 w-4" /> Start
          </button>
          {!paused ? (
            <button
              onClick={pause}
              className="flex items-center gap-2 rounded-xl bg-base-800 px-4 py-2 text-sm font-medium text-slate-300 border border-base-600 hover:bg-base-700 transition-colors"
            >
              <Pause className="h-4 w-4" /> Pause
            </button>
          ) : (
            <button
              onClick={resume}
              className="flex items-center gap-2 rounded-xl bg-base-800 px-4 py-2 text-sm font-medium text-slate-300 border border-base-600 hover:bg-base-700 transition-colors"
            >
              <Play className="h-4 w-4" /> Resume
            </button>
          )}
          <button
            onClick={stop}
            className="flex items-center gap-2 rounded-xl bg-base-800 px-4 py-2 text-sm font-medium text-slate-300 border border-base-600 hover:bg-base-700 transition-colors"
          >
            <Square className="h-4 w-4" /> Stop
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-base-800 px-4 py-2 text-sm font-medium text-slate-300 border border-base-600 hover:bg-base-700 transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs text-slate-500 mr-1">Speed</span>
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => changeSpeed(s)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
                  speed === s
                    ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30"
                    : "text-slate-400 border-base-600 hover:bg-base-800"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <SectionTitle
            title="Current Observation"
            subtitle={
              latest
                ? `record ${latest.index} / ${latest.total_records}`
                : "waiting for data"
            }
          />
          {!obs ? (
            <p className="text-sm text-slate-500">
              Press Start to begin the historical simulation.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Risk Level</span>
                <RiskBadge level={pred.risk_level} />
              </div>
              <MiniRow
                label="Probability"
                value={`${(pred.landslide_probability * 100).toFixed(1)}%`}
              />
              <MiniRow
                label="Rainfall"
                value={`${obs.rainfall_mm.toFixed(1)} mm`}
              />
              <MiniRow
                label="Soil Moisture"
                value={`${obs.soil_moisture_pct.toFixed(1)}%`}
              />
              <MiniRow
                label="Temperature"
                value={`${obs.temperature_c.toFixed(1)} °C`}
              />
              <MiniRow
                label="Humidity"
                value={`${obs.humidity_pct.toFixed(1)}%`}
              />
              <MiniRow label="Slope" value={`${obs.slope_deg.toFixed(1)}°`} />
              <MiniRow
                label="Elevation"
                value={`${obs.elevation_m.toFixed(0)} m`}
              />
              <MiniRow
                label="Location"
                value={`${obs.latitude.toFixed(2)}, ${obs.longitude.toFixed(2)}`}
              />
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle
            title="Live Probability & Rainfall Trend"
            subtitle="Last 40 ticks of the current run"
          />
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={series}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1b2333"
                vertical={false}
              />
              <XAxis
                dataKey="t"
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
              <Line
                type="monotone"
                dataKey="probability"
                name="Probability %"
                stroke="#f43f5e"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="rainfall"
                name="Rainfall mm"
                stroke="#22d3ee"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="soil"
                name="Soil Moisture %"
                stroke="#34d399"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Full Simulation Run (Records 1–500)"
          subtitle="Scroll / drag the selector below the chart to browse the entire run — hover any point to see rainfall, soil moisture and probability together"
        />
        {!fullHistory ? (
          <p className="text-sm text-slate-500">Loading full run...</p>
        ) : (
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={fullHistory} margin={{ bottom: 30 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1b2333"
                vertical={false}
              />
              <XAxis
                dataKey="index"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                label={{
                  value: "Record # (1–500)",
                  position: "insideBottom",
                  offset: -20,
                  fill: "#64748b",
                  fontSize: 11,
                }}
              />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#0d1117",
                  border: "1px solid #1b2333",
                  borderRadius: 8,
                }}
                labelFormatter={(v) => `Record #${v}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="probability"
                name="Probability %"
                stroke="#f43f5e"
                dot={false}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="rainfall_mm"
                name="Rainfall mm"
                stroke="#22d3ee"
                dot={false}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="soil_moisture_pct"
                name="Soil Moisture %"
                stroke="#34d399"
                dot={false}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
              <Brush
                dataKey="index"
                height={24}
                stroke="#22d3ee"
                fill="#131924"
                travellerWidth={10}
                startIndex={0}
                endIndex={Math.min(99, fullHistory.length - 1)}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}

function MiniRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-base-700/40 pb-2 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-200">{value}</span>
    </div>
  );
}
