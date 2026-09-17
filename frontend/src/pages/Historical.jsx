import React, { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Card,
  SectionTitle,
  Badge,
  LoadingSkeleton,
  EmptyState,
} from "../components/ui.jsx";
import Seo from "../components/Seo.jsx";
import { getDatasetHistorical } from "../services/api.js";
import { humanize } from "../utils/format.js";

const PAGE_SIZE = 15;

export default function Historical() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDatasetHistorical({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      search: search || undefined,
    })
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, search]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      <Seo description="Browse real historical landslide events from the NASA Global Landslide Catalog in TerraSense AI." />
      <div>
        <h1 className="text-xl font-bold text-slate-50">Historical Events</h1>
        <p className="text-sm text-slate-500">
          Records from the NASA Global Landslide Catalog
        </p>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-base-600 bg-base-800/60 px-3 py-2">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by title or country..."
            className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
          />
        </div>

        {loading ? (
          <LoadingSkeleton className="h-96" />
        ) : !data || data.events.length === 0 ? (
          <EmptyState
            title="No matching events"
            subtitle="Try a different search term."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-base-700/60 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3">Event</th>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Country</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3">Size</th>
                    <th className="py-2 pr-3">Trigger</th>
                    <th className="py-2 pr-3">Fatalities</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((e) => (
                    <tr
                      key={e.event_id}
                      className="border-b border-base-800 hover:bg-base-800/30"
                    >
                      <td className="py-2.5 pr-3 max-w-xs truncate text-slate-200">
                        {e.title}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-400">
                        {e.date?.slice(0, 10)}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-400">
                        {e.country}
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge color="slate">{humanize(e.category)}</Badge>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-400">
                        {humanize(e.size)}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-400">
                        {humanize(e.trigger)}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-400">
                        {e.fatality_count ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>{data.total.toLocaleString()} total events</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-base-600 p-1.5 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  Page {page + 1} / {totalPages}
                </span>
                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-base-600 p-1.5 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
