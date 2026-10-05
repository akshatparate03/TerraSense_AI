import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Play, Loader2, Globe2 } from "lucide-react";
import { Card, SectionTitle, Badge, LoadingSkeleton } from "./ui.jsx";
import {
  DARK_TILE_URL,
  DARK_TILE_LABELS_URL,
  TILE_ATTRIBUTION,
  TILE_MAX_ZOOM,
} from "../utils/mapTiles.js";
import {
  getScanWatchlist,
  getLatestScanResults,
  wsLiveScanUrl,
} from "../services/api.js";

const RISK_COLOR = {
  HIGH: "#f43f5e",
  MEDIUM: "#f59e0b",
  WARNING: "#f59e0b",
  LOW: "#34d399",
};

function riskColor(level) {
  return RISK_COLOR[level] || "#64748b";
}

function PendingRow({ loc }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-base-700/60 bg-base-800/20 px-4 py-3">
      <div className="text-left">
        <p className="text-sm font-medium text-slate-400">{loc.name}</p>
        <p className="text-xs text-slate-600">{loc.country}</p>
      </div>
      <span className="flex items-center gap-1.5 text-xs text-accent-cyan/80">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> checking...
      </span>
    </div>
  );
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
        <div className="text-left">
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
              <Badge
                color={
                  r.risk_level === "HIGH"
                    ? "rose"
                    : r.risk_level === "LOW"
                      ? "emerald"
                      : "amber"
                }
              >
                {r.risk_level}
              </Badge>
              {r.data_quality === "DEMO" && (
                <Badge color="slate">DEMO DATA</Badge>
              )}
            </div>
          </>
        ) : (
          <span className="text-xs text-slate-600">
            {r.status === "data_unavailable"
              ? "data unavailable"
              : r.status
                ? "check failed"
                : "not scanned yet"}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * The former standalone "Live Risk Scan" page, now a section of the Home page.
 * Same behaviour: shows the watchlist on a map, "Start Live Scan" streams each
 * location's live result over the /ws/live-scan WebSocket.
 */
export default function LiveRiskScanSection() {
  const [watchlist, setWatchlist] = useState(null);
  const [results, setResults] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    getScanWatchlist()
      .then((d) => setWatchlist(d.locations))
      .catch(() => setWatchlist([]));
    getLatestScanResults()
      .then((d) => {
        if (d.results?.some((r) => r.probability != null)) {
          // Results from /scan/latest have no `status`; mark scanned ones "ok".
          setResults(
            d.results.map((r) => ({
              ...r,
              status: r.probability != null ? "ok" : undefined,
            })),
          );
        }
      })
      .catch(() => {});
    return () => wsRef.current?.close();
  }, []);

  const startScan = () => {
    setScanning(true);
    setFinished(false);
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
        setResults(
          [...partial].sort(
            (a, b) => (b.probability ?? -1) - (a.probability ?? -1),
          ),
        );
        setProgress((p) => ({
          done: (p?.done || 0) + 1,
          total: p?.total || partial.length,
        }));
      } else if (msg.type === "scan_complete") {
        setResults(msg.results);
        setScanning(false);
        setFinished(true);
        ws.close();
      }
    };
    ws.onerror = () => {
      setError(
        "Couldn't reach the live scan server. If the backend was idle it may need ~1 minute to wake up — please try again.",
      );
      setScanning(false);
    };
    ws.onclose = () => setScanning(false);
  };

  return (
    <section id="live-risk-scan" className="relative z-10 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
            Live Risk Scan
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500">
            Checks {watchlist?.length ?? "..."} real, named landslide-prone
            regions worldwide right now, using live weather, soil and terrain
            data — not a historical replay.
          </p>
          <button
            onClick={startScan}
            disabled={scanning}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-blue px-6 py-3 text-sm font-semibold text-base-950 shadow-glow transition-transform hover:scale-105 disabled:opacity-60"
          >
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {scanning
              ? `Scanning ${progress?.done ?? 0}/${progress?.total ?? "?"}...`
              : "Start Live Scan"}
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        )}

        {results?.some((r) => r.data_quality === "DEMO") && (
          <p className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
            Some/all results used offline demo data
            (MOCK_EXTERNAL_APIS=true on the backend) — these percentages are
            placeholder values, not real current conditions.
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="text-left">
            <SectionTitle
              title="Global Watchlist Map"
              subtitle="Marker blinks; color reflects the most recent check for that location"
            />
            {!watchlist ? (
              <LoadingSkeleton className="h-[420px]" />
            ) : (
              <MapContainer
                center={[15, 30]}
                zoom={2}
                scrollWheelZoom={false}
                style={{ height: "420px", width: "100%" }}
                className="rounded-xl"
              >
                <TileLayer
                  attribution={TILE_ATTRIBUTION}
                  url={DARK_TILE_URL}
                  maxZoom={TILE_MAX_ZOOM}
                />
                <TileLayer
                  url={DARK_TILE_LABELS_URL}
                  maxZoom={TILE_MAX_ZOOM}
                />
                {watchlist.map((loc) => {
                  const r = results?.find((x) => x.location_id === loc.id);
                  const color = r?.risk_level ? riskColor(r.risk_level) : "#475569";
                  return (
                    <CircleMarker
                      key={loc.id}
                      center={[loc.latitude, loc.longitude]}
                      radius={7}
                      pathOptions={{
                        color,
                        fillColor: color,
                        fillOpacity: 0.8,
                        className: "risk-blink-svg",
                      }}
                    >
                      <Popup>
                        <div className="text-xs">
                          <p className="font-semibold">{loc.name}</p>
                          <p>{loc.country}</p>
                          {r?.probability != null && (
                            <p>
                              {(r.probability * 100).toFixed(1)}% —{" "}
                              {r.risk_level}
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

          <Card className="flex min-h-[520px] flex-col text-left">
            <SectionTitle title="Results — Highest Risk First" />

            {/* idle: big centered call-to-action */}
            {!results && !scanning && (
              <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-accent-cyan/30 bg-accent-cyan/5 shadow-glow">
                  <Globe2 className="h-10 w-10 text-accent-cyan" />
                </div>
                <p className="text-2xl font-bold text-slate-100 sm:text-3xl">
                  Click "Start Live Scan"
                </p>
                <p className="mt-3 max-w-sm text-base text-slate-400">
                  to check the current landslide risk at every one of the{" "}
                  {watchlist?.length ?? "..."} watchlist locations.
                </p>
              </div>
            )}

            {/* scanning / finished: rows appear as they arrive */}
            {(results || scanning) && (
              <div className="flex-1 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 400 }}>
                {(results || []).map((r) => (
                  <ResultRow key={r.location_id} r={r} />
                ))}
                {scanning &&
                  (watchlist || [])
                    .filter((l) => !(results || []).some((r) => r.location_id === l.id))
                    .map((l) => <PendingRow key={l.id} loc={l} />)}
                {finished && (results || []).length === 0 && (
                  <p className="py-10 text-center text-sm text-slate-500">
                    The scan finished but no locations were available to check.
                  </p>
                )}
              </div>
            )}

            {scanning && (
              <div className="mt-4 rounded-xl border border-accent-cyan/20 bg-accent-cyan/5 px-4 py-3">
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-accent-cyan">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching... {progress?.done ?? 0} of {progress?.total ?? "?"}{" "}
                  locations checked
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-base-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-blue transition-all duration-300"
                    style={{
                      width: `${progress?.total ? Math.round((progress.done / progress.total) * 100) : 5}%`,
                    }}
                  />
                </div>
              </div>
            )}
            {finished && !scanning && (results || []).length > 0 && (
              <p className="mt-4 text-center text-xs text-slate-500">
                Scan complete — {(results || []).length} locations checked.
              </p>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
