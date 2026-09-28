import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import AnimatedBackground from "./AnimatedBackground.jsx";

export default function PublicPageShell({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  children,
  wide = false,
  compact = false,
}) {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="fixed inset-0 z-0">
        <AnimatedBackground />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/TerraSense_AI_Logo.svg"
              alt="TerraSense AI logo"
              className="h-9 w-9 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]"
            />
            <span className="text-sm font-bold tracking-wide text-slate-100">
              TerraSense AI
            </span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </nav>

        {/* ---- Animated hero header ---- */}
        <div
          className={`mx-auto w-full ${wide ? "max-w-5xl" : "max-w-3xl"} px-6 ${compact ? "pb-2 pt-1" : "pb-4 pt-4"} text-center`}
        >
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`relative mx-auto flex items-center justify-center ${compact ? "mb-3 h-12 w-12" : "mb-6 h-16 w-16"}`}
          >
            <div
              className="absolute inset-0 -m-4 rounded-full opacity-60 blur-2xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(34,211,238,0.55), transparent 70%)",
              }}
            />
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className={`relative flex items-center justify-center rounded-2xl border border-accent-cyan/30 bg-base-900/70 shadow-glow backdrop-blur ${compact ? "h-12 w-12" : "h-16 w-16"}`}
            >
              {Icon ? (
                <Icon className={compact ? "h-5 w-5 text-accent-cyan" : "h-7 w-7 text-accent-cyan"} />
              ) : (
                <Sparkles className={compact ? "h-5 w-5 text-accent-cyan" : "h-7 w-7 text-accent-cyan"} />
              )}
            </motion.div>
          </motion.div>

          {eyebrow && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className={`inline-flex items-center gap-2 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-4 py-1.5 text-xs font-medium tracking-wide text-accent-cyan ${compact ? "mb-2" : "mb-3"}`}
            >
              {eyebrow}
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`font-extrabold tracking-tight text-slate-50 ${compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"}`}
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className={`mx-auto max-w-xl text-slate-500 ${compact ? "mt-1.5 text-xs" : "mt-3 text-sm"}`}
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`mx-auto w-full ${wide ? "max-w-5xl" : "max-w-3xl"} flex-1 px-6 ${compact ? "pb-8" : "pb-16"}`}
        >
          <div className={`glass relative overflow-hidden rounded-3xl ${compact ? "p-5 sm:p-6" : "p-6 sm:p-10"}`}>
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(59,130,246,0.6), transparent 70%)",
              }}
            />
            <div className="relative">{children}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
