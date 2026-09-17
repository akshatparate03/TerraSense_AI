import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Card, SectionTitle, LoadingSkeleton } from "../components/ui.jsx";
import Seo from "../components/Seo.jsx";
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

export default function MapView() {
  const [locations, setLocations] = useState(null);

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
            <TileLayer
              attribution="&copy; OpenStreetMap contributors, &copy; CARTO"
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {locations.map((loc) => (
              <CircleMarker
                key={loc.id}
                center={[loc.latitude, loc.longitude]}
                radius={5}
                pathOptions={{
                  color: SIZE_COLOR[loc.size] || "#64748b",
                  fillColor: SIZE_COLOR[loc.size] || "#64748b",
                  fillOpacity: 0.7,
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
            ))}
          </MapContainer>
        )}
      </Card>
    </div>
  );
}
