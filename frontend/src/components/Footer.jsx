import React from "react";
import { Link } from "react-router-dom";

const SOCIAL_LINKS = [
  { name: "GitHub", href: "#", icon: GithubIcon },
  { name: "Instagram", href: "#", icon: InstagramIcon },
  { name: "Telegram", href: "#", icon: TelegramIcon },
];

// Pages that are NOT in the sidebar live here instead.
const PLATFORM_LINKS = [
  ["Dashboard", "/dashboard"],
  ["Risk Prediction", "/predict"],
  ["Manage Locations", "/locations"],
  ["Simulation Archive", "/simulation-archive"],
  ["Historical Events", "/historical"],
  ["Alerts", "/alerts"],
];

const INTELLIGENCE_LINKS = [
  ["Analytics", "/analytics"],
  ["Locations / Map", "/map"],
  ["About System", "/about"],
];

const COMPANY_LINKS = [
  ["Contact Us", "/contact"],
  ["Privacy Policy", "/privacy"],
  ["Terms & Conditions", "/terms"],
];

export default function Footer({ className = "" }) {
  return (
    <footer className={`relative z-10 px-6 py-12 ${className}`}>
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

          <FooterColumn title="Platform" links={PLATFORM_LINKS} />
          <FooterColumn title="Intelligence" links={INTELLIGENCE_LINKS} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
        </div>

        <div className="mt-10 pt-6 text-center text-[11px] text-slate-600">
          © {new Date().getFullYear()} TerraSense AI. All rights reserved.
        </div>
      </div>
    </footer>
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
