import React from "react";
import { Github, Linkedin, Mail } from "lucide-react";
import { Card, SectionTitle } from "../components/ui.jsx";
import Seo from "../components/Seo.jsx";

const TEAM = [
  { name: "Team Member 1", role: "Project Lead / Backend & ML", photo: null },
  { name: "Team Member 2", role: "Frontend & UI/UX", photo: null },
  { name: "Team Member 3", role: "Data Engineering & Database", photo: null },
  { name: "Team Member 4", role: "Documentation & Testing", photo: null },
];

export default function About() {
  return (
    <div className="space-y-6">
      <Seo description="About TerraSense AI — a machine learning based intelligent landslide risk assessment and early warning system. Learn about the methodology, team, and attribution." />
      <div>
        <h1 className="text-xl font-bold text-slate-50">About TerraSense AI</h1>
        <p className="text-sm text-slate-500">
          Machine Learning Based Intelligent Landslide Risk Assessment and Early
          Warning System
        </p>
      </div>

      <Card>
        <SectionTitle title="Objective" />
        <p className="text-sm leading-relaxed text-slate-400">
          TerraSense AI ("Sense the Earth. Predict the Risk.") is a machine
          learning powered platform that assesses landslide risk from
          environmental conditions and demonstrates a complete early-warning
          workflow — real historical data, a trained ML pipeline,
          PostgreSQL-backed persistence and analytics, and a live
          historical-data monitoring dashboard.
        </p>
      </Card>

      <Card>
        <SectionTitle title="Data Source & Honesty About Simulated Fields" />
        <p className="text-sm leading-relaxed text-slate-400">
          The historical event data (location, date, trigger, category, size,
          fatalities) comes from the{" "}
          <strong className="text-slate-300">
            NASA Global Landslide Catalog
          </strong>
          . That catalog records only landslide events and has no rain-gauge,
          soil-moisture, slope, or elevation sensor readings, and no "no
          landslide occurred" examples. To train a two-class classifier, this
          project generates a{" "}
          <strong className="text-slate-300">
            documented, seeded, clearly-labeled simulated environmental feature
            set
          </strong>{" "}
          (rainfall, soil moisture, slope, elevation, temperature, humidity)
          conditioned on the real trigger/size fields, plus pseudo-absence
          negative samples (a standard technique in landslide susceptibility
          literature). Every prediction response includes a{" "}
          <code className="mx-1 rounded bg-base-800 px-1 text-xs">
            data_provenance
          </code>
          block naming exactly which fields are real vs. simulated. No metric,
          probability, or feature-importance value shown anywhere in this app is
          hardcoded — everything comes from the trained pipeline and PostgreSQL.
        </p>
      </Card>

      <Card>
        <SectionTitle title="Methodology" />
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-400">
          <li>
            Data cleaning: deduplication, coordinate validation, trigger/date
            parsing
          </li>
          <li>
            Feature engineering: real geo/temporal/trigger features + documented
            simulated environmental features
          </li>
          <li>
            Models evaluated: Logistic Regression, Decision Tree, Random Forest,
            Gradient Boosting, XGBoost
          </li>
          <li>
            Stratified 80/20 train-test split with 5-fold cross-validation
          </li>
          <li>Best model selected by ROC-AUC on held-out test data</li>
          <li>
            Explainability via feature_importances_ from the selected tree-based
            model — a model-level association, not a causal claim
          </li>
          <li>
            PostgreSQL persists every prediction, alert, reading, location,
            historical event, and model version for a full audit trail
          </li>
        </ul>
      </Card>

      <Card>
        <SectionTitle title="Historical Data Simulation" />
        <p className="text-sm leading-relaxed text-slate-400">
          The "Live Monitoring" feature replays 500 real catalog records through
          the trained model over WebSocket to emulate a live feed, persisting
          every reading/prediction/alert to PostgreSQL. It automatically stops
          after the 500th record and does not restart on its own. This is
          explicitly a{" "}
          <strong className="text-slate-300">Historical Data Simulation</strong>{" "}
          — not live physical sensor data.
        </p>
      </Card>

      <Card>
        <SectionTitle title="Limitations & Future Scope" />
        <p className="text-sm leading-relaxed text-slate-400">
          TerraSense AI is a{" "}
          <strong className="text-slate-300">
            software-based risk intelligence platform
          </strong>{" "}
          and does not replace certified geological monitoring or official
          emergency-warning infrastructure. It does not use live sensor
          hardware. Future work could integrate real public
          rainfall/soil-moisture datasets (e.g. satellite precipitation, digital
          elevation models) to replace the simulated environmental features with
          genuine measurements, and extend explainability with SHAP.
        </p>
      </Card>

      <Card>
        <SectionTitle
          title="Project Team"
          subtitle="The people behind TerraSense AI"
        />
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="flex flex-col items-center text-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent-cyan/30 bg-base-800 text-2xl font-bold text-accent-cyan">
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  member.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-slate-200">
                {member.name}
              </p>
              <p className="text-xs text-slate-500">{member.role}</p>
              <div className="mt-1 flex gap-2 text-slate-600">
                <Github className="h-3.5 w-3.5" />
                <Linkedin className="h-3.5 w-3.5" />
                <Mail className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] text-slate-600">
          Placeholder photos and links — replace with real team member details
          before submission/deployment.
        </p>
      </Card>

      <Card>
        <SectionTitle title="Foundations" />
        <p className="text-sm leading-relaxed text-slate-400">
          TerraSense AI's early-warning concept builds on and substantially
          extends an{" "}
          <a
            href="https://github.com/Sadcato/Landslide-monitoring-and-early-warning-system-based-on-deep-learning"
            target="_blank"
            rel="noreferrer"
            className="text-accent-cyan underline"
          >
            open-source hardware-monitoring foundation
          </a>{" "}
          — the original sensor-hardware architecture (Arduino/GNSS/DHT11/YL-69)
          and rule-based risk formula have been replaced end-to-end with a real
          machine learning pipeline, a PostgreSQL persistence layer, full
          authentication, and a redesigned platform. See README.md for the
          complete list of changes.
        </p>
      </Card>
    </div>
  );
}
