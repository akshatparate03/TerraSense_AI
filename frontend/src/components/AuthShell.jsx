import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, BrainCircuit, Radio } from "lucide-react";
import AnimatedBackground from "./AnimatedBackground.jsx";

const SIDE_POINTS = [
  {
    icon: BrainCircuit,
    text: "Real ML models trained on real historical data",
  },
  { icon: Radio, text: "Software-based historical monitoring simulation" },
  {
    icon: ShieldCheck,
    text: "Secure, verified accounts with PostgreSQL-backed audit trail",
  },
];

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="relative flex min-h-screen bg-base-950">
      {/* Left branding panel - hidden on small screens */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <AnimatedBackground variant="side" />
        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <img
            src="/TerraSense_AI_Logo.svg"
            alt="TerraSense AI logo"
            className="h-16 w-16 drop-shadow-[0_0_14px_rgba(34,211,238,0.45)]"
          />
          <div>
            <p className="text-sm font-bold leading-tight tracking-wide text-slate-100">
              TerraSense AI
            </p>
            <p className="text-[10px] font-medium leading-tight tracking-wider text-accent-cyan">
              Sense the Earth. Predict the Risk.
            </p>
          </div>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md"
        >
          <h2 className="text-4xl font-extrabold leading-tight text-slate-50">
            Machine Learning Based{" "}
            <span className="text-gradient">Landslide Intelligence</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            An intelligent environmental risk platform — real ML models, real
            historical data, real-time simulation, and PostgreSQL-backed
            analytics.
          </p>
          <div className="mt-8 space-y-4">
            {SIDE_POINTS.map((p) => (
              <div key={p.text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-base-800/80 text-accent-cyan">
                  <p.icon className="h-4 w-4" />
                </div>
                <p className="text-sm text-slate-400">{p.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="relative z-10 text-[11px] text-slate-600">
          Software-based risk intelligence platform. Not a certified emergency
          warning service.
        </p>
      </div>

      {/* Right form panel */}
      <div className="relative flex w-full flex-1 items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <AnimatedBackground />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass relative z-10 w-full max-w-md rounded-2xl p-8 shadow-glow"
        >
          <Link
            to="/"
            className="mb-6 flex items-center justify-center gap-2.5 lg:hidden"
          >
            <img
              src="/TerraSense_AI_Logo.svg"
              alt="TerraSense AI logo"
              className="h-16 w-16 drop-shadow-[0_0_14px_rgba(34,211,238,0.45)]"
            />
            <div className="text-left">
              <p className="text-sm font-bold leading-tight tracking-wide text-slate-100">
                TerraSense AI
              </p>
              <p className="text-[10px] font-medium leading-tight tracking-wider text-accent-cyan">
                Sense the Earth. Predict the Risk.
              </p>
            </div>
          </Link>
          <h1 className="text-center text-xl font-bold text-slate-50 lg:text-left">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-center text-sm text-slate-500 lg:text-left">
              {subtitle}
            </p>
          )}
          <div className="mt-6">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
