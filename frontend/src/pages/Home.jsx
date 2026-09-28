import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Database,
  Radio,
  ShieldCheck,
  BarChart3,
  Map as MapIcon,
  Sparkles,
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground.jsx";
import TerrainVisualization from "../components/TerrainVisualization.jsx";
import Seo from "../components/Seo.jsx";
import { getPublicStats } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Real Machine Learning",
    desc: "5 candidate models trained and compared on real historical data — Logistic Regression, Decision Tree, Random Forest, Gradient Boosting, and XGBoost. No hardcoded metrics.",
  },
  {
    icon: Database,
    title: "PostgreSQL Backed",
    desc: "Every prediction, alert, reading, and model version is persisted with full relational integrity and a complete audit trail.",
  },
  {
    icon: Radio,
    title: "Historical Data Simulation",
    desc: "A live monitoring feed replays real catalog records with adjustable playback speed up to 50x.",
  },
  {
    icon: ShieldCheck,
    title: "Early Warning Alerts",
    desc: "Automatic alerts generated the moment a real prediction crosses a risk threshold, with a full acknowledgement workflow.",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    desc: "Explore seasonal trends, feature correlations, and model performance across the full landslide catalog.",
  },
  {
    icon: MapIcon,
    title: "Interactive Risk Map",
    desc: "Visualize real historical landslide events and monitored locations on an interactive map.",
  },
];

const SOCIAL_LINKS = [
  { name: "GitHub", href: "#", icon: GithubIcon },
  { name: "Instagram", href: "#", icon: InstagramIcon },
  { name: "Telegram", href: "#", icon: TelegramIcon },
];

export default function Home() {
  const [stats, setStats] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    getPublicStats()
      .then(setStats)
      .catch(() => {});
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

      {/* ---------------- FEATURES ---------------- */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
              A Complete Risk Intelligence Platform
            </h2>
            <p className="mt-3 text-slate-500">
              Every number you see comes from a real trained model or a real
              database query.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- 3D SHOWCASE ---------------- */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
            3D Terrain Risk Visualization
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            An interactive terrain rendering with animated, labeled risk
            hotspots. Click once to activate, then drag to rotate.
          </p>
          <motion.div
            initial={{ opacity: 1, y: 16 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative mt-10"
          >
            <TerrainVisualization height={460} className="shadow-glow" />
          </motion.div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
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
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="relative z-10 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5">
                <img
                  src="/TerraSense_AI_Logo.svg"
                  alt="TerraSense AI logo"
                  className="h-9 w-9 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                />
                <span className="text-sm font-semibold text-slate-200">
                  TerraSense AI
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Software-based risk intelligence platform.
              </p>
              <div className="mt-4 flex items-center gap-3">
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    title={s.name}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-base-600 text-slate-400 transition-colors hover:border-accent-cyan/50 hover:text-accent-cyan"
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <FooterColumn
              title="Platform"
              links={[
                ["Dashboard", "/dashboard"],
                ["Live Risk Scan", "/monitoring"],
                ["Risk Prediction", "/predict"],
                ["Simulation Archive", "/simulation-archive"],
                ["ML Model", "/model"],
              ]}
            />
            <FooterColumn
              title="Intelligence"
              links={[
                ["Analytics", "/analytics"],
                ["Historical Events", "/historical"],
                ["Locations / Map", "/map"],
                ["Alerts", "/alerts"],
                ["About System", "/about"],
              ]}
            />
            <FooterColumn
              title="Company"
              links={[
                ["Contact Us", "/contact"],
                ["Privacy Policy", "/privacy"],
                ["Terms & Conditions", "/terms"],
              ]}
            />
          </div>

          <div className="mt-10 pt-6 text-center text-[11px] text-slate-600">
            © {new Date().getFullYear()} TerraSense AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link
              to={href}
              className="text-xs text-slate-500 transition-colors hover:text-accent-cyan"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
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

function FeatureCard({ feature: f, index }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 24 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      whileHover={{ y: -6 }}
      className="glass group relative overflow-hidden rounded-2xl p-6 transition-shadow hover:shadow-glow"
    >
      {/* animated moving gradient sheen on hover */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent-cyan/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

      <motion.div
        whileHover={{ rotate: 12, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="relative mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-blue/20 text-accent-cyan"
      >
        <f.icon className="h-5 w-5" />
      </motion.div>
      <h3 className="relative text-base font-semibold text-slate-100">
        {f.title}
      </h3>
      <p className="relative mt-2 text-sm leading-relaxed text-slate-500">
        {f.desc}
      </p>
      <div className="relative mt-4 h-px w-0 bg-gradient-to-r from-accent-cyan to-accent-blue transition-all duration-500 group-hover:w-full" />
    </motion.div>
  );
}

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.69-1.28-1.69-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.18 1.82 1.18 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.2.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function InstagramIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TelegramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.5 3.5 2.7 10.9c-1.1.44-1.1 1.06-.2 1.34l4.8 1.5 1.8 5.6c.22.6.38.84.78.84.33 0 .48-.15.68-.34l1.9-1.85 4 2.95c.73.4 1.26.2 1.44-.68l2.6-12.3c.27-1.1-.42-1.6-1-1.36Zm-11.6 9.5-1.1-3.6 8.6-5.4c.28-.17.53-.08.32.11l-7.8 8.9Z" />
    </svg>
  );
}
