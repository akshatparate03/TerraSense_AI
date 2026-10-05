import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Satellite,
  CloudRain,
  Mountain,
  Layers,
  Database,
  History,
  BrainCircuit,
  Radio,
  Bell,
  BarChart3,
  ShieldCheck,
  Globe2,
  Gauge,
  Sparkles,
  ArrowRight,
  Workflow,
  Eye,
  Server,
  MonitorSmartphone,
} from "lucide-react";
import TerrainVisualization from "../components/TerrainVisualization.jsx";
import Seo from "../components/Seo.jsx";
import { useAuth } from "../context/AuthContext.jsx";

/* ------------------------------------------------------------------ */
/*  Small shared primitives                                            */
/* ------------------------------------------------------------------ */

function FadeIn({ children, delay = 0, y = 24, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 1, y }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ icon: Icon, children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-4 py-1.5 text-xs font-medium tracking-wide text-accent-cyan">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, icon, title, sub, center = true }) {
  return (
    <FadeIn className={center ? "text-center" : ""}>
      {eyebrow && (
        <div className={`mb-4 flex ${center ? "justify-center" : ""}`}>
          <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
        </div>
      )}
      <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-4 text-slate-400 ${center ? "mx-auto max-w-2xl" : "max-w-2xl"}`}
        >
          {sub}
        </p>
      )}
    </FadeIn>
  );
}

/** Vertical or horizontal animated pipeline of labeled stages, connected by
 * a line that draws itself in as the section scrolls into view. Pure
 * SVG/CSS + framer-motion -- no extra 3D cost. */
function PipelineFlow({ stages, direction = "vertical" }) {
  const isVert = direction === "vertical";
  return (
    <div
      className={`relative flex ${isVert ? "flex-col items-stretch gap-0" : "flex-col gap-6 md:flex-row md:items-start"}`}
    >
      {stages.map((stage, i) => (
        <React.Fragment key={stage.label}>
          <FadeIn delay={i * 0.08} y={isVert ? 16 : 24} className="relative">
            <div
              className={`glass flex items-center gap-4 rounded-2xl p-4 ${isVert ? "" : "md:flex-col md:text-center"}`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-blue/20 text-accent-cyan">
                {stage.icon ? (
                  <stage.icon className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-bold">{i + 1}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {stage.label}
                </p>
                {stage.desc && (
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    {stage.desc}
                  </p>
                )}
              </div>
            </div>
          </FadeIn>
          {i < stages.length - 1 &&
            (isVert ? (
              <div className="ml-[38px] flex h-8 w-px items-stretch justify-center">
                <motion.div
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 + 0.15 }}
                  style={{ transformOrigin: "top" }}
                  className="w-px flex-1 bg-gradient-to-b from-accent-cyan/60 to-accent-blue/10"
                />
              </div>
            ) : (
              <div className="hidden items-center justify-center md:flex md:pt-9">
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 + 0.15 }}
                  style={{ transformOrigin: "left" }}
                  className="h-px w-6 bg-gradient-to-r from-accent-cyan/60 to-accent-blue/10"
                />
              </div>
            ))}
        </React.Fragment>
      ))}
    </div>
  );
}

/** Floating data-layer chips -- used for the "Reading the Earth" section. */
function OrbitLayers({ layers }) {
  return (
    <div className="relative mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3">
      {layers.map((l, i) => (
        <FadeIn key={l.label} delay={i * 0.05} y={16}>
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="glass group relative flex flex-col items-center gap-2 rounded-2xl p-4 text-center"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-emerald/20 text-accent-cyan">
              <l.icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-slate-200">{l.label}</p>
          </motion.div>
        </FadeIn>
      ))}
    </div>
  );
}

function StatChip({ value, label }) {
  return (
    <div className="text-center">
      <p className="whitespace-nowrap text-base font-bold text-gradient sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function DiffCard({ icon: Icon, title, desc, index }) {
  return (
    <FadeIn delay={index * 0.06}>
      <motion.div
        whileHover={{ y: -6 }}
        className="glass group relative h-full overflow-hidden rounded-2xl p-6"
      >
        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent-cyan/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <div className="relative mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-blue/20 text-accent-cyan">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="relative text-base font-semibold text-slate-100">
          {title}
        </h3>
        <p className="relative mt-2 text-sm leading-relaxed text-slate-500">
          {desc}
        </p>
      </motion.div>
    </FadeIn>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function About() {
  const { user } = useAuth();

  return (
    <div className="relative -m-3 min-h-screen overflow-x-clip sm:-m-4 md:-m-8">
      <Seo description="Inside TerraSense AI — an Earth-observation and machine-learning platform combining remote sensing, geospatial intelligence and predictive analytics to assess landslide risk." />

      {/* ================= HERO ================= */}
      <section className="relative z-10 flex flex-col justify-center px-6 py-16 lg:min-h-[92vh] lg:py-20">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-2 [&>*]:min-w-0">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Eyebrow icon={Sparkles}>Inside TerraSense AI</Eyebrow>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-50 sm:text-4xl md:text-5xl"
            >
              Where <span className="text-gradient">Earth Intelligence</span>{" "}
              Meets AI
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-5 text-sm font-medium uppercase tracking-widest text-accent-cyan/80"
            >
              Machine Learning · Remote Sensing · Geospatial Intelligence ·
              Landslide Prediction
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-slate-400"
            >
              TerraSense AI is an intelligent Earth-observation and
              machine-learning platform built to understand environmental
              conditions, analyze geospatial signals, and predict landslide
              risk across the world.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link
                to={user ? "/predict" : "/register"}
                className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-blue px-6 py-3 text-sm font-semibold text-base-950 shadow-glow transition-transform hover:scale-105"
              >
                {user ? "Analyze a Location" : "Get Started"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to={user ? "/analytics" : "/login"}
                className="rounded-full border border-base-600 px-6 py-3 text-sm font-medium text-slate-300 backdrop-blur transition-colors hover:bg-base-800"
              >
                Explore Analytics
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="mt-10 grid max-w-md grid-cols-1 gap-4 pt-6 sm:grid-cols-3"
            >
              <StatChip value="5" label="ML models compared" />
              <StatChip value="1988–2017" label="Catalog span" />
              <StatChip value="Global" label="Analysis coverage" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <TerrainVisualization
              height={440}
              className="shadow-glow"
            />
            <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-accent-cyan/30 bg-base-950/70 px-3 py-1 text-[11px] font-medium text-accent-cyan backdrop-blur">
              <Radio className="h-3 w-3 animate-pulse" /> Earth Intelligence
              Command View
            </div>
          </motion.div>
        </div>

        <div className="mt-14 flex justify-center">
          <div className="h-9 w-5 animate-float-slow rounded-full border border-slate-600 p-1">
            <div className="h-1.5 w-full rounded-full bg-accent-cyan" />
          </div>
        </div>
      </section>

      {/* ================= WHAT IS TERRASENSE ================= */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            eyebrow="Overview"
            icon={Globe2}
            title="What is TerraSense AI?"
            sub="A software-based landslide prediction and Earth-intelligence platform that combines machine learning, remote sensing, satellite-derived information, geospatial analysis, and predictive analytics into a single pipeline."
          />

          <FadeIn delay={0.15} className="mt-12">
            <div className="glass rounded-3xl p-6 sm:p-10">
              <p className="text-center text-sm leading-relaxed text-slate-400 sm:text-base">
                Instead of treating landslide prediction as a single-variable
                problem, TerraSense brings together multiple dimensions of
                Earth and environmental information — weather, terrain, soil,
                and built-environment context — and processes them through an
                intelligent prediction pipeline.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "Weather Data",
                    "Terrain & Elevation",
                    "Soil Conditions",
                    "Built Environment",
                    "Historical Events",
                  ].map((d) => (
                    <span
                      key={d}
                      className="rounded-full border border-base-600 bg-base-800/60 px-3 py-1.5 text-xs text-slate-300"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <ArrowRight className="hidden h-5 w-5 shrink-0 rotate-90 text-accent-cyan sm:block sm:rotate-0" />
                <span className="rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-4 py-2 text-xs font-semibold text-accent-cyan">
                  TERRASENSE AI ENGINE
                </span>
                <ArrowRight className="hidden h-5 w-5 shrink-0 rotate-90 text-accent-cyan sm:block sm:rotate-0" />
                <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300">
                  LANDSLIDE RISK
                </span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ================= READING THE EARTH ================= */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            eyebrow="The Earth Data Layer"
            icon={Layers}
            title="Reading the Earth"
            sub="TerraSense continuously draws on multiple layers of environmental and geospatial information for every location it analyzes."
          />
          <FadeIn delay={0.15} className="mt-12">
            <OrbitLayers
              layers={[
                { label: "Live Weather Data", icon: CloudRain },
                { label: "Terrain & Elevation", icon: Mountain },
                { label: "Soil Conditions", icon: Layers },
                { label: "Built Environment", icon: Server },
                { label: "Historical Landslide Events", icon: History },
                { label: "Geospatial Context", icon: Globe2 },
              ]}
            />
          </FadeIn>
        </div>
      </section>

      {/* ================= REMOTE SENSING ================= */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-5xl grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Earth Observation"
              icon={Satellite}
              title="Seeing What the Ground Can't Tell Us"
              sub={null}
              center={false}
            />
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-slate-400">
              TerraSense uses remote sensing and Earth-observation data
              sources to understand large-scale environmental and terrain
              conditions relevant to landslide risk — live weather and
              rainfall accumulation, elevation-derived slope and aspect, and
              soil composition, retrieved automatically for any point on the
              map rather than entered by hand.
            </p>
          </div>
          <FadeIn delay={0.1}>
            <PipelineFlow
              stages={[
                { label: "Earth Observation Sources", icon: Satellite },
                { label: "Remote Sensing Data", icon: Radio },
                { label: "Geospatial Processing", icon: Globe2 },
                { label: "Feature Extraction", icon: Workflow },
                { label: "ML Risk Engine", icon: BrainCircuit },
              ]}
            />
          </FadeIn>
        </div>
      </section>

      {/* ================= GLOBAL INTELLIGENCE ================= */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            eyebrow="Global Scope"
            icon={Globe2}
            title="From Local Terrain to Global Risk Intelligence"
            sub="TerraSense is built to analyze landslide risk anywhere — the same Earth-observation pipeline runs for any latitude and longitude, not a fixed set of monitored sites."
          />
          <FadeIn delay={0.15} className="mt-12">
            <GlobeGrid />
          </FadeIn>
        </div>
      </section>

      {/* ================= ML ENGINE ================= */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            eyebrow="The Intelligence Layer"
            icon={BrainCircuit}
            title="The Machine Learning Engine"
            sub="Multiple candidate models are trained and compared on the historical catalog; the best performer by ROC-AUC on held-out data becomes the active model behind every prediction."
          />
          <FadeIn delay={0.15} className="mt-12">
            <PipelineFlow
              direction="horizontal"
              stages={[
                { label: "Data", icon: Database },
                { label: "Preprocessing", icon: Layers },
                { label: "Feature Engineering", icon: Workflow },
                { label: "Model Inference", icon: BrainCircuit },
                { label: "Risk Probability", icon: Gauge },
                { label: "Risk Classification", icon: ShieldCheck },
              ]}
            />
          </FadeIn>
          <FadeIn delay={0.25} className="mt-10">
            <div className="glass flex flex-wrap items-center justify-center gap-3 rounded-2xl p-5">
              {[
                "Logistic Regression",
                "Decision Tree",
                "Random Forest",
                "Gradient Boosting",
                "XGBoost",
              ].map((m) => (
                <span
                  key={m}
                  className="rounded-full border border-base-600 bg-base-800/60 px-3 py-1.5 text-xs text-slate-300"
                >
                  {m}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ================= SIGNALS TO PREDICTION ================= */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            eyebrow="The Pipeline"
            icon={Workflow}
            title="From Signals to Prediction"
            sub="Every location analyzed moves through the same nine-stage pipeline, end to end."
          />
          <FadeIn delay={0.15} className="mt-12">
            <PipelineFlow
              stages={[
                { label: "Earth Observation", icon: Satellite },
                { label: "Remote Sensing", icon: Radio },
                { label: "Environmental Data", icon: CloudRain },
                { label: "Geospatial Analysis", icon: Globe2 },
                { label: "Feature Engineering", icon: Workflow },
                { label: "Machine Learning", icon: BrainCircuit },
                { label: "Risk Probability", icon: Gauge },
                { label: "Risk Level", icon: ShieldCheck },
                { label: "Early Warning", icon: Bell },
              ]}
            />
          </FadeIn>
          <FadeIn delay={0.3} className="mt-10 flex flex-wrap justify-center gap-3">
            {[
              { level: "LOW", color: "border-risk-low/40 bg-risk-low/10 text-risk-low" },
              { level: "MEDIUM", color: "border-risk-medium/40 bg-risk-medium/10 text-risk-medium" },
              { level: "HIGH", color: "border-risk-high/40 bg-risk-high/10 text-risk-high" },
            ].map((r) => (
              <span
                key={r.level}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${r.color}`}
              >
                {r.level}
              </span>
            ))}
          </FadeIn>
        </div>
      </section>

      {/* ================= LIVE INTELLIGENCE ================= */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            eyebrow="Continuous Awareness"
            icon={Radio}
            title="From Prediction to Continuous Awareness"
            sub="TerraSense is not just a static prediction form. Live Risk Scan pulls fresh environmental data for any point on demand, and a WebSocket-driven streaming engine keeps a continuous monitoring feed running for the platform's early-warning workflow."
          />
          <FadeIn delay={0.15} className="mt-12">
            <PipelineFlow
              direction="horizontal"
              stages={[
                { label: "Data Stream", icon: Radio },
                { label: "Analysis", icon: Workflow },
                { label: "Prediction", icon: BrainCircuit },
                { label: "Risk Change", icon: Gauge },
                { label: "Alert", icon: Bell },
                { label: "Monitoring", icon: Eye },
              ]}
            />
          </FadeIn>
        </div>
      </section>

      {/* ================= EARLY WARNING ================= */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            eyebrow="Early Warning"
            icon={Bell}
            title="Turning Risk Into Early Awareness"
            sub="When a prediction crosses a configured risk threshold, TerraSense automatically raises an alert with a full acknowledgement workflow — risk intelligence and early-warning support, not a certified emergency service."
          />
          <FadeIn delay={0.15} className="mt-12">
            <PipelineFlow
              stages={[
                { label: "Normal", icon: ShieldCheck },
                { label: "Risk Detected", icon: Eye },
                { label: "Risk Increase", icon: Gauge },
                { label: "Threshold Reached", icon: Workflow },
                { label: "Alert Raised", icon: Bell },
                { label: "Monitoring Continues", icon: Radio },
              ]}
            />
          </FadeIn>
        </div>
      </section>

      {/* ================= HISTORICAL INTELLIGENCE ================= */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            eyebrow="Historical Intelligence"
            icon={History}
            title="Learning From What Has Already Happened"
            sub="The NASA Global Landslide Catalog (1988–2017) grounds the platform in real recorded events — locations, dates, triggers, and outcomes that shape the model's understanding of risk patterns."
          />
          <FadeIn delay={0.15} className="mt-10">
            <div className="glass grid grid-cols-2 gap-6 rounded-2xl p-8 sm:grid-cols-4">
              <StatChip value="11,000+" label="Catalog events" />
              <StatChip value="1988–2017" label="Time span" />
              <StatChip value="140+" label="Countries represented" />
              <StatChip value="3" label="Trigger types tracked" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ================= ANALYTICS ================= */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            eyebrow="Analytics"
            icon={BarChart3}
            title="See the Intelligence Behind the Prediction"
            sub="Seasonal trends, feature correlations, geographic distribution, and model performance metrics — computed from the real catalog and the trained pipeline, not hardcoded."
          />
          <FadeIn delay={0.15} className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: BarChart3, label: "Seasonal Trends" },
              { icon: Layers, label: "Feature Correlations" },
              { icon: Globe2, label: "Geographic Distribution" },
              { icon: Gauge, label: "Model Performance" },
            ].map((a, i) => (
              <FadeIn key={a.label} delay={i * 0.05}>
                <div className="glass flex flex-col items-center gap-2 rounded-2xl p-5 text-center">
                  <a.icon className="h-5 w-5 text-accent-cyan" />
                  <p className="text-xs font-medium text-slate-300">
                    {a.label}
                  </p>
                </div>
              </FadeIn>
            ))}
          </FadeIn>
        </div>
      </section>

      {/* ================= TRANSPARENCY ================= */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            eyebrow="Transparency"
            icon={Eye}
            title="Intelligence You Can Inspect"
            sub="Every prediction should have context — not just a risk number."
          />
          <FadeIn delay={0.15} className="mt-12">
            <div className="glass relative rounded-3xl p-8 sm:p-10">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  "Data source per field",
                  "Live / cached / estimated status",
                  "Model name & version",
                  "Prediction confidence",
                  "Feature importances",
                  "Data quality rating",
                ].map((t) => (
                  <div
                    key={t}
                    className="rounded-xl border border-base-600 bg-base-800/50 p-3 text-center text-xs text-slate-300"
                  >
                    {t}
                  </div>
                ))}
              </div>
              <p className="mt-8 text-center text-sm leading-relaxed text-slate-400">
                Every prediction response is annotated with exactly where
                each value came from and how confident the model is — nothing
                shown in the app is a hardcoded number.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ================= TECHNOLOGY ARCHITECTURE ================= */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            eyebrow="Technology"
            icon={Layers}
            title="Engineered Across Multiple Layers"
            sub="Each layer of TerraSense has a focused job — together they form the full Earth-intelligence pipeline."
          />
          <FadeIn delay={0.15} className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                title: "Earth / Data",
                icon: Satellite,
                items: ["Live weather & rainfall", "Elevation & slope", "Soil composition"],
              },
              {
                title: "Intelligence",
                icon: BrainCircuit,
                items: ["Machine learning models", "Feature engineering", "Predictive analytics"],
              },
              {
                title: "Backend",
                icon: Server,
                items: ["FastAPI services", "Async data ingestion", "WebSocket streaming"],
              },
              {
                title: "Database",
                icon: Database,
                items: ["PostgreSQL persistence", "Predictions & alerts", "Historical catalog"],
              },
              {
                title: "Frontend",
                icon: MonitorSmartphone,
                items: ["React interface", "3D terrain visualization", "Interactive maps & analytics"],
              },
            ].map((layer, i) => (
              <FadeIn key={layer.title} delay={i * 0.06}>
                <div className="glass h-full rounded-2xl p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-blue/20 text-accent-cyan">
                    <layer.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-100">
                    {layer.title}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {layer.items.map((it) => (
                      <li
                        key={it}
                        className="text-xs leading-relaxed text-slate-500"
                      >
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </FadeIn>
        </div>
      </section>

      {/* ================= SYSTEM ARCHITECTURE ================= */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            eyebrow="System Architecture"
            icon={Workflow}
            title="Data In, Intelligence Out"
            sub={null}
          />
          <FadeIn delay={0.15} className="mt-12">
            <PipelineFlow
              stages={[
                { label: "Earth / Satellite / Environment", icon: Satellite },
                { label: "Data Ingestion", icon: Radio },
                { label: "Remote Sensing / Geospatial Processing", icon: Globe2 },
                { label: "Feature Engineering", icon: Workflow },
                { label: "ML Engine", icon: BrainCircuit },
                { label: "Prediction", icon: Gauge },
                { label: "Database / Intelligence Layer", icon: Database },
                { label: "Dashboard", icon: BarChart3 },
                { label: "Monitoring / Alerts", icon: Bell },
              ]}
            />
          </FadeIn>
        </div>
      </section>

      {/* ================= WHY TERRASENSE ================= */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Why TerraSense"
            icon={ShieldCheck}
            title="What Sets TerraSense AI Apart"
            sub={null}
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <DiffCard
              index={0}
              icon={Layers}
              title="Multi-Source Earth Intelligence"
              desc="Combining diverse environmental and geospatial signals rather than a single variable."
            />
            <DiffCard
              index={1}
              icon={BrainCircuit}
              title="Machine-Learning Driven"
              desc="Transforming complex environmental patterns into predictive risk intelligence."
            />
            <DiffCard
              index={2}
              icon={Globe2}
              title="Global Perspective"
              desc="Designed to analyze landslide risk across geographic regions worldwide, not a fixed site list."
            />
            <DiffCard
              index={3}
              icon={Satellite}
              title="Remote Sensing"
              desc="Using Earth-observation intelligence to understand large-scale terrain and environmental conditions."
            />
            <DiffCard
              index={4}
              icon={Radio}
              title="Continuous Monitoring"
              desc="Moving from isolated predictions toward ongoing risk awareness through streaming analysis."
            />
            <DiffCard
              index={5}
              icon={Eye}
              title="Visual Intelligence"
              desc="Turning complex Earth data into understandable maps, models, analytics and alerts."
            />
          </div>
        </div>
      </section>

      {/* ================= FINAL BRAND STATEMENT ================= */}
      <section className="relative z-10 overflow-hidden px-6 py-28">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="bg-grid-lines absolute inset-0" />
          <div className="orb orb-cyan" />
          <div className="orb orb-blue" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-950 via-base-950/60 to-transparent" />
        <div className="relative mx-auto max-w-3xl text-center">
          <FadeIn>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-50 sm:text-5xl">
              SENSE THE EARTH.
              <br />
              <span className="text-gradient">PREDICT THE RISK.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
              TerraSense AI brings Earth observation, remote sensing,
              geospatial intelligence and machine learning together to
              transform complex environmental signals into landslide risk
              intelligence.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={user ? "/predict" : "/register"}
                className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-blue px-7 py-3.5 text-sm font-semibold text-base-950 shadow-glow transition-transform hover:scale-105"
              >
                {user ? "Analyze a Location" : "Get Started Free"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Lightweight animated "globe" -- a dot grid with a few pulsing risk  */
/*  nodes and drifting arcs, entirely CSS/SVG (no extra 3D scene cost). */
/* ------------------------------------------------------------------ */

function GlobeGrid() {
  const nodes = [
    { x: 18, y: 30 },
    { x: 34, y: 55 },
    { x: 52, y: 22 },
    { x: 66, y: 48 },
    { x: 80, y: 28 },
    { x: 46, y: 70 },
  ];
  return (
    <div className="glass relative mx-auto h-72 w-full max-w-3xl overflow-hidden rounded-3xl sm:h-80">
      <div className="bg-grid-lines absolute inset-0" />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {nodes.map((n, i) =>
          nodes
            .slice(i + 1)
            .filter((_, j) => j < 1)
            .map((m, k) => (
              <motion.line
                key={`${i}-${k}`}
                x1={n.x}
                y1={n.y}
                x2={m.x}
                y2={m.y}
                stroke="#22d3ee"
                strokeWidth="0.3"
                strokeOpacity="0.35"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: i * 0.1 }}
              />
            )),
        )}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r="1.1" fill="#22d3ee" />
            <motion.circle
              cx={n.x}
              cy={n.y}
              r="1.1"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="0.4"
              initial={{ r: 1.1, opacity: 0.8 }}
              animate={{ r: 4, opacity: 0 }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: i * 0.35,
                ease: "easeOut",
              }}
            />
          </g>
        ))}
      </svg>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-accent-cyan/30 bg-base-950/70 px-3 py-1 text-[11px] font-medium text-accent-cyan backdrop-blur">
        Location-agnostic analysis, anywhere on Earth
      </div>
    </div>
  );
}
