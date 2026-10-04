import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

/**
 * Shown on the Risk Prediction page, BEFORE a live-location result, when some
 * site details (soil texture / nearby buildings / construction sites) could not
 * be fetched automatically.
 *
 *  - "Use estimated values"  -> run the prediction with location-based estimates
 *  - "I have these values"   -> go to the manual tab with everything that WAS
 *                               fetched pre-filled; only the missing fields are empty
 *  - X / Esc / click outside -> cancel, nothing is predicted
 */
export default function MissingDataDialog({
  open,
  missing = [],
  onUseEstimated,
  onProvide,
  onClose,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="missing-data-title"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="glass relative w-full max-w-md rounded-2xl border border-base-600 p-6 shadow-glow"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-base-800 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3
                  id="missing-data-title"
                  className="text-base font-semibold text-slate-50"
                >
                  Some location data couldn't be fetched
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  We couldn't retrieve the following details for this location:
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {missing.map((m) => (
                <li
                  key={m.key}
                  className="flex items-center gap-2 rounded-lg border border-base-600 bg-base-800/50 px-3 py-2 text-sm text-slate-200"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {m.label}
                </li>
              ))}
            </ul>

            <p className="mt-4 text-sm text-slate-400">
              Would you like us to use estimated values based on the location,
              or would you rather enter these values yourself?
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onUseEstimated}
                className="flex-1 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-4 py-2.5 text-sm font-semibold text-base-950 shadow-glow transition-opacity hover:opacity-90"
              >
                Use estimated values
              </button>
              <button
                onClick={onProvide}
                className="flex-1 rounded-xl border border-base-500 bg-base-800/40 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-accent-cyan/50 hover:text-accent-cyan"
              >
                I have these values
              </button>
            </div>

            <p className="mt-3 text-center text-[11px] text-slate-600">
              Estimated values are clearly labelled as ESTIMATED in your result.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
