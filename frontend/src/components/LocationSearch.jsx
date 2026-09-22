import React, { useEffect, useRef, useState } from "react";
import { Search, Loader2, MapPin } from "lucide-react";

// Nominatim (OpenStreetMap's free, keyless geocoding search) -- the closest
// free equivalent to Google Places Autocomplete. Usage policy requires: no
// more than ~1 request/second and identifying the calling application,
// which is why every keystroke is debounced by 500ms rather than firing on
// every character. Coverage/precision for house numbers and small lanes
// depends on how densely OpenStreetMap has been mapped in that area -- it
// is generally very good for cities, towns and villages worldwide, but can
// be thinner than Google's for very small rural streets in some regions.
// It never requires an API key or billing account, which for a keyless
// system fits the rest of TerraSense's data sources.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const DEBOUNCE_MS = 500;

export default function LocationSearch({ onSelect, placeholder = "Search for a place, area, or address..." }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const runSearch = async (text) => {
    if (!text || text.trim().length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const url = `${NOMINATIM_URL}?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setOpen(true);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), DEBOUNCE_MS);
  };

  const handlePick = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setQuery(item.display_name);
    setOpen(false);
    setResults([]);
    onSelect(lat, lon, item.display_name);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-base-600 bg-base-800/60 px-3 py-2 focus-within:border-accent-cyan/50">
        <Search className="h-4 w-4 shrink-0 text-slate-500" />
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-500" />}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-[1200] mt-1 w-full overflow-hidden rounded-lg border border-base-600 bg-base-900 shadow-xl">
          {results.map((item) => (
            <button
              key={item.place_id}
              type="button"
              onClick={() => handlePick(item)}
              className="flex w-full items-start gap-2 border-b border-base-700/50 px-3 py-2 text-left text-xs last:border-0 hover:bg-base-800"
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-cyan" />
              <span className="text-slate-300">{item.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
