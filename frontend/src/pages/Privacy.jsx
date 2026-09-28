import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock } from "lucide-react";
import Seo from "../components/Seo.jsx";
import PublicPageShell from "../components/PublicPageShell.jsx";

function Section({ number, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 20 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="group relative mb-8 pl-14 last:mb-0"
    >
      <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl border border-accent-cyan/30 bg-accent-cyan/10 text-sm font-bold text-accent-cyan shadow-glow transition-transform duration-300 group-hover:scale-110">
        {number}
      </div>
      <h2 className="text-base font-semibold text-slate-100 sm:text-lg">
        {title}
      </h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-slate-400">
        {children}
      </div>
    </motion.div>
  );
}

export default function Privacy() {
  return (
    <PublicPageShell
      icon={ShieldCheck}
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="How TerraSense AI collects, uses, and protects your information."
    >
      <Seo description="TerraSense AI Privacy Policy." />

      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-accent-cyan/20 bg-accent-cyan/5 p-4 text-xs leading-relaxed text-cyan-200/90">
        <Lock className="h-5 w-5 shrink-0 text-accent-cyan" />
        We collect only what's needed to run your account and predictions —
        we never sell your personal information.
      </div>

      <Section number="1" title="Information We Collect">
        <p>We collect the following information when you use TerraSense AI:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Account details you provide — name, email address, and whether you're registering as an individual or an organization/agency.</li>
          <li>Locations, radii, and inputs you submit for risk predictions.</li>
          <li>Basic usage data needed to operate the platform (e.g. saved monitoring locations, alert history, prediction history tied to your account).</li>
          <li>Messages you send through our Contact page (name, email, message content, sender type).</li>
        </ul>
      </Section>

      <Section number="2" title="How We Use Your Information">
        <p>Your information is used to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Create and secure your account, including email verification via a one-time code.</li>
          <li>Run the predictions and analytics you request, and show your own prediction/alert history on your dashboard.</li>
          <li>Send you alert emails for locations you've chosen to monitor.</li>
          <li>Respond to messages sent through our Contact page.</li>
        </ul>
        <p>We do not sell your personal information to third parties.</p>
      </Section>

      <Section number="3" title="Third-Party Data & Services">
        <p>
          TerraSense AI retrieves environmental data (weather, elevation,
          soil, building/construction context) from third-party providers
          to run its predictions. It also uses Google Sign-In for optional
          authentication and a Google Apps Script–based mail relay to
          deliver verification codes, password resets, alert emails, and
          Contact form messages.
        </p>
      </Section>

      <Section number="4" title="Data Storage & Security">
        <p>
          Account and prediction data is stored in a PostgreSQL database.
          Passwords are stored as salted hashes, never in plain text.
          Session access uses signed tokens with expiry.
        </p>
      </Section>

      <Section number="5" title="Cookies & Local Storage">
        <p>
          The platform uses your browser's local storage to keep you
          signed in between visits. We do not use third-party advertising
          trackers or sell browsing data.
        </p>
      </Section>

      <Section number="6" title="Data Retention">
        <p>
          We retain your account and prediction history for as long as
          your account remains active, so your dashboard can reflect your
          own usage over time. You may request deletion at any time (see
          below).
        </p>
      </Section>

      <Section number="7" title="Your Choices">
        <p>
          You may update your monitored locations or stop monitoring at
          any time from within the app. To request deletion of your
          account and associated data, please reach out via our{" "}
          <a href="/contact" className="text-accent-cyan hover:underline">
            Contact page
          </a>
          .
        </p>
      </Section>

      <Section number="8" title="Children's Privacy">
        <p>
          TerraSense AI is not directed at children under 13, and we do
          not knowingly collect personal information from them.
        </p>
      </Section>

      <Section number="9" title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Material
          changes will be reflected by updating the date this page was
          last revised.
        </p>
      </Section>

      <Section number="10" title="Contact">
        <p>
          For privacy-related questions, use our{" "}
          <a href="/contact" className="text-accent-cyan hover:underline">
            Contact page
          </a>
          .
        </p>
      </Section>
    </PublicPageShell>
  );
}
