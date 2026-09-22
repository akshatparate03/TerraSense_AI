import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Card, LoadingSkeleton } from "../components/ui.jsx";
import Seo from "../components/Seo.jsx";
import LocationSearch from "../components/LocationSearch.jsx";
import { DARK_TILE_URL, DARK_TILE_LABELS_URL, TILE_ATTRIBUTION, TILE_MAX_ZOOM } from "../utils/mapTiles.js";
import { getDatasetLocations } from "../services/api.js";
import { humanize } from "../utils/format.js";

const SIZE_COLOR = {
  small: "#34d399",
  medium: "#f59e0b",
  large: "#f43f5e",
  very_large: "#f43f5e",
  catastrophic: "#f43f5e",
  unknown: "#64748b",
};

function FlyToSearchResult({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 10, { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.[0], target?.[1]]);
  return null;
}

export default function MapView() {
  const [locations, setLocations] = useState(null);
  const [searchTarget, setSearchTarget] = useState(null);

  useEffect(() => {
    getDatasetLocations(300).then((d) => setLocations(d.locations));
  }, []);

  return (
    <div className="space-y-6">
      <Seo description="Interactive map of real historical landslide locations in TerraSense AI." />
      <div>
        <h1 className="text-xl font-bold text-slate-50">Locations / Map</h1>
        <p className="text-sm text-slate-500">
          Real historical landslide locations from the catalog — marker color
          reflects recorded size
        </p>
      </div>

      <LocationSearch onSelect={(lat, lon) => setSearchTarget([lat, lon])} placeholder="Jump to a place on the map..." />

      <Card hover={false} className="p-0 overflow-hidden">
        {!locations ? (
          <LoadingSkeleton className="h-[560px]" />
        ) : (
          <MapContainer
            center={[20, 20]}
            zoom={2}
            style={{ height: "560px", width: "100%" }}
            className="rounded-2xl"
          >
            <TileLayer attribution={TILE_ATTRIBUTION} url={DARK_TILE_URL} maxZoom={TILE_MAX_ZOOM} />
            <TileLayer url={DARK_TILE_LABELS_URL} maxZoom={TILE_MAX_ZOOM} />
            <FlyToSearchResult target={searchTarget} />
            {locations.map((loc) => {
              const color = SIZE_COLOR[loc.size] || "#64748b";
              return (
                <CircleMarker
                  key={loc.id}
                  center={[loc.latitude, loc.longitude]}
                  radius={6}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.75,
                    className: "risk-blink-svg",
                  }}
                >
                  <Popup>
                    <div className="text-xs">
                      <p className="font-semibold">{loc.name}</p>
                      <p>{loc.country}</p>
                      <p>Category: {humanize(loc.category)}</p>
                      <p>Size: {humanize(loc.size)}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </Card>
    </div>
  );
}
