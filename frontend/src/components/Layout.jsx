import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Radio,
  Target,
  BarChart3,
  History,
  BrainCircuit,
  Map as MapIcon,
  Info,
  Bell,
  MapPin,
  LogOut,
  Menu,
  X,
  Home,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import AnimatedBackground from "./AnimatedBackground.jsx";

const NAV = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/monitoring", label: "Live Monitoring", icon: Radio },
  { to: "/predict", label: "Risk Prediction", icon: Target },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/historical", label: "Historical Events", icon: History },
  { to: "/model", label: "ML Model", icon: BrainCircuit },
  { to: "/map", label: "Locations / Map", icon: MapIcon },
  { to: "/locations", label: "Manage Locations", icon: MapPin },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/about", label: "About System", icon: Info },
];

function SidebarBrand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-5 py-6">
      <img
        src="/TerraSense_AI_Logo.svg"
        alt="TerraSense AI logo"
        className="h-12 w-12 shrink-0 drop-shadow-[0_0_14px_rgba(34,211,238,0.45)] sm:h-14 sm:w-14"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold leading-tight tracking-wide text-slate-100">
          TerraSense AI
        </p>
        <p className="truncate text-[10px] font-medium leading-tight tracking-wider text-accent-cyan">
          Sense the Earth. Predict the Risk.
        </p>
      </div>
    </Link>
  );
}

function SidebarNav({ onNavigate }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/dashboard" || to === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-accent-cyan/10 text-accent-cyan"
                : "text-slate-400 hover:bg-base-800 hover:text-slate-200"
            }`
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarFooter({ user, logout }) {
  return (
    <div className="space-y-3 border-t border-base-700/60 px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-300">
            {user?.name || "Guest"}
          </p>
          <p className="truncate text-[11px] text-slate-600">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          title="Log out"
          className="shrink-0 rounded-lg border border-base-600 p-1.5 text-slate-400 transition-colors hover:bg-base-800 hover:text-rose-400"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
      <p className="text-center text-[10px] leading-snug text-slate-600">
        Software-based risk intelligence platform.
        <br /> Not a certified emergency warning service.
      </p>
    </div>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        <AnimatedBackground variant="side" />
      </div>

      {/* ---------------- Desktop sidebar (md and up) ---------------- */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-base-700/60 bg-base-900/80 backdrop-blur-xl md:flex">
        <SidebarBrand />
        <SidebarNav />
        <SidebarFooter user={user} logout={logout} />
      </aside>

      {/* ---------------- Mobile top bar (below md) ---------------- */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-base-700/60 bg-base-900/90 px-4 py-3 backdrop-blur-xl md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/TerraSense_AI_Logo.svg"
            alt="TerraSense AI logo"
            className="h-9 w-9 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]"
          />
          <span className="text-sm font-bold text-slate-100">
            TerraSense AI
          </span>
        </Link>
        <button
          onClick={() => setMobileNavOpen(true)}
          className="rounded-lg border border-base-600 p-2 text-slate-300"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ---------------- Mobile slide-in nav drawer ---------------- */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col border-r border-base-700/60 bg-base-900 shadow-2xl">
            <div className="flex items-center justify-between px-2">
              <SidebarBrand />
              <button
                onClick={() => setMobileNavOpen(false)}
                className="mr-3 shrink-0 rounded-lg border border-base-600 p-2 text-slate-300"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
            <SidebarFooter user={user} logout={logout} />
          </div>
        </div>
      )}

      <div className="relative z-10 md:ml-64">
        <main className="mx-auto max-w-[1400px] px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
