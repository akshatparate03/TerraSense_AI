// Shared tile-layer config for every Leaflet map in TerraSense AI.
//
// WHY THIS FILE EXISTS: the app previously used CartoDB's free "dark_all"
// basemap (basemaps.cartocdn.com). CartoDB has since restricted anonymous/
// keyless usage, so those tiles now render as a broken pattern reading
// "API KEY REQUIRED" instead of an actual map. Esri's public ArcGIS Online
// basemap tile services (services.arcgisonline.com) are free, keyless, and
// do not display any such placeholder -- they're a standard, widely used
// choice for hobby/education Leaflet projects. Switching everything to
// import from this one file means every map in the app is fixed by editing
// it in exactly one place.
//
// Small, unremovable "Esri" text does appear faintly in the bottom-right of
// the tiles themselves (baked into the imagery) -- this is Esri's own
// branding, not a paywall message, and every free basemap provider
// (Google, Mapbox, Esri, CARTO) requires *some* attribution/branding by
// its terms of use. The `attribution` string below is the separate,
// removable-if-you-self-host on-page credit text (required by OSM/Esri's
// terms) -- that one CAN be restyled/shrunk via CSS but not deleted while
// using free_ tiles.

// Base layer: neutral dark canvas, worldwide.
export const DARK_TILE_URL =
  "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";

// Reference layer: place-name / border labels drawn on top of the base
// layer (Esri publishes these as two separate layers so labels can be
// toggled independently -- we always show both stacked for readability).
export const DARK_TILE_LABELS_URL =
  "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";

export const TILE_ATTRIBUTION =
  "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors";

export const TILE_MAX_ZOOM = 16;
