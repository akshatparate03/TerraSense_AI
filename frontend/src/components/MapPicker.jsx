import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { LocateFixed } from "lucide-react";
import LocationSearch from "./LocationSearch.jsx";
import { DARK_TILE_URL, DARK_TILE_LABELS_URL, TILE_ATTRIBUTION, TILE_MAX_ZOOM } from "../utils/mapTiles.js";

// Default marker icon fix -- react-leaflet + Vite doesn't auto-resolve
// leaflet's default marker images from node_modules.
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnChange({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom() < 8 ? 9 : map.getZoom(), { duration: 0.8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.[0], position?.[1]]);
  return null;
}

/**
 * MapPicker
 * Props:
 *  - latitude, longitude: currently selected point (number | null)
 *  - radiusKm: analysis radius in km, drawn as a circle overlay
 *  - onChange(lat, lon): called on click or marker drag
 *  - height: CSS height of the map container
 */
export default function MapPicker({
  latitude,
  longitude,
  radiusKm = 5,
  onChange,
  height = "420px",
}) {
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(null);
  const markerRef = useRef(null);

  const hasSelection = latitude != null && longitude != null;
  const position = hasSelection ? [latitude, longitude] : null;
  const center = position || [22.5, 78.9]; // fallback: center of India

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocateError("Geolocation is not supported by this browser.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        setLocateError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Pick a point on the map instead."
            : "Could not get your current location. Pick a point on the map instead.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-3">
      <LocationSearch onSelect={(lat, lon) => onChange(lat, lon)} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Search above, click the map, drag the marker, or use GPS
        </p>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-base-600 bg-base-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-accent-cyan/50 disabled:opacity-50"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          {locating ? "Locating..." : "Use My Location"}
        </button>
      </div>

      {locateError && (
        <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-300">
          {locateError}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-base-600">
        <MapContainer
          center={center}
          zoom={hasSelection ? 9 : 4}
          style={{ height, width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer attribution={TILE_ATTRIBUTION} url={DARK_TILE_URL} maxZoom={TILE_MAX_ZOOM} />
          <TileLayer url={DARK_TILE_LABELS_URL} maxZoom={TILE_MAX_ZOOM} />
          <ClickHandler onSelect={onChange} />
          <RecenterOnChange position={position} />
          {hasSelection && (
            <>
              <Marker
                position={position}
                icon={markerIcon}
                draggable
                eventHandlers={{
                  dragend: () => {
                    const m = markerRef.current;
                    if (m) {
                      const { lat, lng } = m.getLatLng();
                      onChange(lat, lng);
                    }
                  },
                }}
                ref={markerRef}
              />
              <Circle
                center={position}
                radius={radiusKm * 1000}
                pathOptions={{
                  color: "#22d3ee",
                  fillColor: "#22d3ee",
                  fillOpacity: 0.12,
                  weight: 1.5,
                }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {hasSelection && (
        <p className="text-xs text-slate-500">
          Selected:{" "}
          <span className="text-slate-300">
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </span>{" "}
          &middot; Radius: <span className="text-slate-300">{radiusKm} km</span>
        </p>
      )}
    </div>
  );
}
