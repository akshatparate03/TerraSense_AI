import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Play, Loader2, Globe2 } from "lucide-react";
import { Card, SectionTitle, Badge, LoadingSkeleton } from "../components/ui.jsx";
import Seo from "../components/Seo.jsx";
import { DARK_TILE_URL, DARK_TILE_LABELS_URL, TILE_ATTRIBUTION, TILE_MAX_ZOOM } from "../utils/mapTiles.js";
import { getScanWatchlist, getLatestScanResults, wsLiveScanUrl } from "../services/api.js";

const RISK_COLOR = { HIGH: "#f43f5e", MEDIUM: "#f59e0b", WARNING: "#f59e0b", LOW: "#34d399" };

function riskColor(level) {
  return RISK_COLOR[level] || "#64748b";
}

function ResultRow({ r }) {
  const color = riskColor(r.risk_level);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-base-700/60 bg-base-800/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className="risk-blink-marker h-2.5 w-2.5 shrink-0"
          style={{ backgroundColor: r.status === "ok" ? color : "#475569" }}
        />
        <div>
          <p className="text-sm font-medium text-slate-200">{r.name}</p>
          <p className="text-xs text-slate-500">{r.country}</p>
        </div>
      </div>
      <div className="text-right">
        {r.status === "ok" ? (
          <>
            <p className="text-sm font-semibold" style={{ color }}>
              {(r.probability * 100).toFixed(1)}%
            </p>
            <div className="flex items-center justify-end gap-1.5">
              <Badge color={r.risk_level === "HIGH" ? "rose" : r.risk_level === "LOW" ? "emerald" : "amber"}>
                {r.risk_level}
              </Badge>
              {r.data_quality === "DEMO" && <Badge color="slate">DEMO DATA</Badge>}
            </div>
          </>
        ) : (
          <span className="text-xs text-slate-600">
            {r.status === "data_unavailable" ? "data unavailable" : "check failed"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function LiveGlobalScan() {
  const [watchlist, setWatchlist] = useState(null);
  const [results, setResults] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    getScanWatchlist().then((d) => setWatchlist(d.locations));
    getLatestScanResults()
      .then((d) => {
        if (d.results?.some((r) => r.probability != null)) setResults(d.results);
      })
      .catch(() => {});
    return () => wsRef.current?.close();
  }, []);

  const startScan = () => {
    setScanning(true);
    setError(null);
    setProgress(null);
    const partial = [];
    setResults(null);

    const ws = new WebSocket(wsLiveScanUrl());
    wsRef.current = ws;

    ws.onopen = () => ws.send("start");
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.type === "scan_started") {
        setProgress({ done: 0, total: msg.total });
      } else if (msg.type === "location_result") {
        partial.push(msg);
        setResults([...partial].sort((a, b) => (b.probability ?? -1) - (a.probability ?? -1)));
        setProgress((p) => ({ done: (p?.done || 0) + 1, total: p?.total || partial.length }));
      } else if (msg.type === "scan_complete") {
        setResults(msg.results);
        setScanning(false);
        ws.close();
      }
    };
    ws.onerror = () => {
      setError("Live scan connection failed. Is the backend running?");
      setScanning(false);
    };
    ws.onclose = () => setScanning(false);
  };

  return (
    <div className="space-y-6">
      <Seo description="Live landslide risk scan across real, named landslide-prone regions worldwide, using live weather/soil/terrain data." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-50">Live Risk Scan</h1>
          <p className="text-sm text-slate-500">
            Checks {watchlist?.length ?? "..."} real, named landslide-prone regions worldwide right
            now, using live weather/soil/terrain data — not a historical replay
          </p>
        </div>
        <button
          onClick={startScan}
          disabled={scanning}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-4 py-2.5 text-sm font-semibold text-base-950 disabled:opacity-60"
        >
          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {scanning ? `Scanning ${progress?.done ?? 0}/${progress?.total ?? "?"}...` : "Start Live Scan"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-300">{error}</p>
      )}

      {results?.some((r) => r.data_quality === "DEMO") && (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
          Some/all results used offline demo data (MOCK_EXTERNAL_APIS=true on the backend) — these
          percentages are placeholder values, not real current conditions. Disable that setting and
          use a live internet connection for genuine live risk numbers.
        </p>
      )}

      <Card>
        <SectionTitle
          title="Global Watchlist Map"
          subtitle="Marker blinks; color reflects the most recent check for that location"
        />
        {!watchlist ? (
          <LoadingSkeleton className="h-[420px]" />
        ) : (
          <MapContainer center={[15, 30]} zoom={2} style={{ height: "420px", width: "100%" }} className="rounded-xl">
            <TileLayer attribution={TILE_ATTRIBUTION} url={DARK_TILE_URL} maxZoom={TILE_MAX_ZOOM} />
            <TileLayer url={DARK_TILE_LABELS_URL} maxZoom={TILE_MAX_ZOOM} />
            {watchlist.map((loc) => {
              const r = results?.find((x) => x.location_id === loc.id);
              const color = r ? riskColor(r.risk_level) : "#475569";
              return (
                <CircleMarker
                  key={loc.id}
                  center={[loc.latitude, loc.longitude]}
                  radius={7}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.8, className: "risk-blink-svg" }}
                >
                  <Popup>
                    <div className="text-xs">
                      <p className="font-semibold">{loc.name}</p>
                      <p>{loc.country}</p>
                      {r?.status === "ok" && (
                        <p>
                          {(r.probability * 100).toFixed(1)}% — {r.risk_level}
                        </p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </Card>

      <Card>
        <SectionTitle title="Results — Highest Risk First" subtitle="Real locations, real live data" />
        {!results && !scanning && (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Globe2 className="h-4 w-4" /> Click "Start Live Scan" to check current risk at every watchlist location.
          </p>
        )}
        {results && (
          <div className="space-y-2">
            {results.map((r) => (
              <ResultRow key={r.location_id} r={r} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
