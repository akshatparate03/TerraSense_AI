import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground.jsx";
import TerrainVisualization from "../components/TerrainVisualization.jsx";
import LandslideArt from "../components/LandslideArt.jsx";
import LiveRiskScanSection from "../components/LiveRiskScanSection.jsx";
import Footer from "../components/Footer.jsx";
import Seo from "../components/Seo.jsx";
import { getPublicStats, getRecentLandslides } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [landslides, setLandslides] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    getPublicStats()
      .then(setStats)
      .catch(() => {});
    getRecentLandslides()
      .then(setLandslides)
      .catch(() => setLandslides({ points: [], note: "" }));
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Seo description="TerraSense AI — Machine Learning Based Intelligent Landslide Risk Assessment and Early Warning System. Sense the Earth. Predict the Risk." />

      {/* Single continuous animated background behind the ENTIRE page (every
          section below is transparent and simply sits on top of this). */}
      <div className="fixed inset-0 z-0">
        <AnimatedBackground />
      </div>

      {/* ---------------- HERO ---------------- */}
      <section className="relative z-10 flex min-h-screen flex-col">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
            <img
              src="/TerraSense_AI_Logo.svg"
              alt="TerraSense AI logo"
              className="h-14 w-14 drop-shadow-[0_0_14px_rgba(34,211,238,0.45)]"
            />
            <span className="text-sm font-bold tracking-wide text-slate-100">
              TerraSense AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="rounded-full bg-gradient-to-r from-accent-cyan to-accent-blue px-5 py-2 text-sm font-semibold text-base-950 shadow-glow transition-transform hover:scale-105"
              >
                Get Started
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-gradient-to-r from-accent-cyan to-accent-blue px-5 py-2 text-sm font-semibold text-base-950 shadow-glow transition-transform hover:scale-105"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-4 py-1.5 text-xs font-medium text-accent-cyan"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Machine Learning Powered Early Warning Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl font-extrabold tracking-tight text-slate-50 sm:text-6xl md:text-7xl"
          >
            Terra<span className="text-gradient">Sense</span> AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 max-w-2xl text-lg text-slate-400 sm:text-xl"
          >
            Sense the Earth. Predict the Risk.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4 max-w-2xl text-sm text-slate-500 sm:text-base"
          >
            An intelligent landslide risk assessment and early warning platform
            — real historical data, real trained ML models, live historical
            simulation, and PostgreSQL-backed analytics.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-4"
          >
            {user ? (
              <Link
                to="/dashboard"
                className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-blue px-7 py-3.5 text-sm font-semibold text-base-950 shadow-glow transition-transform hover:scale-105"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-blue px-7 py-3.5 text-sm font-semibold text-base-950 shadow-glow transition-transform hover:scale-105"
                >
                  Create Free Account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-base-600 px-7 py-3.5 text-sm font-medium text-slate-300 backdrop-blur transition-colors hover:bg-base-800"
                >
                  I already have an account
                </Link>
              </>
            )}
          </motion.div>

          {stats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4"
            >
              <StatBlock
                value={stats.historical_events?.toLocaleString()}
                label="Historical Events"
              />
              <StatBlock
                value={stats.total_predictions?.toLocaleString()}
                label="ML Predictions Made"
              />
              <StatBlock
                value={stats.monitored_locations}
                label="Monitored Locations"
              />
              <StatBlock
                value={
                  stats.active_model_accuracy
                    ? `${(stats.active_model_accuracy * 100).toFixed(0)}%`
                    : "—"
                }
                label="Model Accuracy"
              />
            </motion.div>
          )}
        </div>

        <div className="flex justify-center pb-8">
          <div className="h-9 w-5 animate-float-slow rounded-full border border-slate-600 p-1">
            <div className="h-1.5 w-full rounded-full bg-accent-cyan" />
          </div>
        </div>
      </section>

      {/* ---------------- LANDSLIDE GALLERY (decorative) ---------------- */}
      <section className="relative z-10 px-6 pb-4 pt-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-accent-cyan/80">
            Why early warning matters
          </p>
          <div className="mt-6 grid grid-cols-6 items-end gap-3 sm:gap-5">
            <div className="col-span-3 sm:col-span-2">
              <LandslideArt variant="slope" className="w-full border border-base-600 shadow-glow" />
            </div>
            <div className="col-span-3 sm:col-span-1">
              <LandslideArt variant="rockfall" className="w-full border border-base-600 opacity-90" />
            </div>
            <div className="col-span-6 sm:col-span-2">
              <LandslideArt variant="mudflow" className="w-full border border-base-600 shadow-glow" />
            </div>
            <div className="hidden sm:col-span-1 sm:block">
              <LandslideArt variant="cracked" className="w-full border border-base-600 opacity-90" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 3D SHOWCASE ---------------- */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <div className="flex items-center justify-center gap-6">
            <LandslideArt variant="cracked" className="hidden w-28 border border-base-600 lg:block" />
            <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
              Worldwide Landslides — Last 12 Months
            </h2>
            <LandslideArt variant="rockfall" className="hidden w-28 border border-base-600 lg:block" />
          </div>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500">
            Every point is a reported landslide, placed on the terrain by its
            real location. Green = low impact, yellow = medium, red = high
            (fatalities or large slides). Click once to activate, then drag to
            rotate.
          </p>
          <motion.div
            initial={{ opacity: 1, y: 16 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative mt-10"
          >
            <TerrainVisualization
              points={
                landslides
                  ? landslides.points.map((p) => ({
                      id: p.id,
                      name: `${p.name}${p.country && p.country !== "unknown" ? `, ${p.country}` : ""}`,
                      latitude: p.latitude,
                      longitude: p.longitude,
                      level: p.level,
                    }))
                  : []
              }
              emptyMessage={
                landslides
                  ? "No landslide data available right now."
                  : "Loading landslide data..."
              }
              height={460}
              className="shadow-glow"
            />
          </motion.div>
          {landslides?.window_start && (
            <div className="mx-auto mt-4 max-w-2xl space-y-1 text-xs text-slate-500">
              <p>
                <span className="font-semibold text-red-600">
                  {landslides.counts.HIGH.toLocaleString()} high
                </span>
                {" · "}
                <span className="font-semibold text-yellow-600">
                  {landslides.counts.MEDIUM.toLocaleString()} medium
                </span>
                {" · "}
                <span className="font-semibold text-green-600">
                  {landslides.counts.LOW.toLocaleString()} low
                </span>
                {" — "}
                {landslides.total_events.toLocaleString()} events
                {landslides.shown < landslides.total_events &&
                  `, showing a representative ${landslides.shown.toLocaleString()}`}
              </p>
              <p>{landslides.note}</p>
              <p className="text-slate-600">Source: {landslides.source}</p>
            </div>
          )}
        </div>
      </section>

      {/* ---------------- LIVE RISK SCAN (moved here from its own page) ---------------- */}
      <LiveRiskScanSection />

      {/* ---------------- CTA ---------------- */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-8">
          <LandslideArt variant="mudflow" className="hidden w-52 border border-base-600 opacity-90 md:block" />
        <div className="max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
            {user ? "Ready to dive back in?" : "Ready to explore the platform?"}
          </h2>
          <p className="mt-3 text-slate-500">
            {user
              ? "Jump back into live monitoring, predictions, and the full analytics dashboard."
              : "Create a free account to unlock live monitoring, predictions, and the full analytics dashboard."}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-blue px-7 py-3.5 text-sm font-semibold text-base-950 shadow-glow transition-transform hover:scale-105"
            >
              {user ? "Get Started" : "Get Started Free"}{" "}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
          <LandslideArt variant="slope" className="hidden w-52 border border-base-600 opacity-90 md:block" />
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <Footer />
    </div>
  );
}

function StatBlock({ value, label }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-gradient sm:text-3xl">
        {value ?? "—"}
      </p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}
