import React from 'react'
import { motion } from 'framer-motion'

export const RISK_COLORS = {
  LOW: { text: 'text-risk-low', bg: 'bg-risk-low/10', border: 'border-risk-low/30', dot: 'bg-risk-low' },
  MEDIUM: { text: 'text-risk-medium', bg: 'bg-risk-medium/10', border: 'border-risk-medium/30', dot: 'bg-risk-medium' },
  HIGH: { text: 'text-risk-high', bg: 'bg-risk-high/10', border: 'border-risk-high/30', dot: 'bg-risk-high' },
}

export function Card({ children, className = '', glow = false, hover = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`glass rounded-2xl p-5 ${hover ? 'transition-shadow duration-300 hover:shadow-glow' : ''} ${glow ? 'shadow-glow' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function Badge({ children, color = 'cyan', className = '' }) {
  const map = {
    cyan: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    slate: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${map[color] || map.slate} ${className}`}>
      {children}
    </span>
  )
}

export function RiskBadge({ level }) {
  const c = RISK_COLORS[level] || RISK_COLORS.LOW
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${c.text} ${c.bg} ${c.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot} animate-pulse`} />
      {level} RISK
    </span>
  )
}

export function KpiCard({ label, value, sub, accent = 'cyan', icon: Icon }) {
  const colorMap = {
    cyan: 'text-accent-cyan',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
  }
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
        {Icon && <Icon className={`h-4 w-4 ${colorMap[accent]}`} />}
      </div>
      <motion.p
        key={value}
        initial={{ opacity: 0.4, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-2 text-2xl font-bold ${colorMap[accent]}`}
      >
        {value}
      </motion.p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </Card>
  )
}

export function LoadingSkeleton({ className = 'h-24' }) {
  return <div className={`animate-pulse rounded-2xl bg-base-800/60 ${className}`} />
}

export function EmptyState({ title, subtitle, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-base-600 py-14 text-center">
      {Icon && <Icon className="mb-3 h-8 w-8 text-slate-600" />}
      <p className="text-sm font-medium text-slate-400">{title}</p>
      {subtitle && <p className="mt-1 max-w-xs text-xs text-slate-600">{subtitle}</p>}
    </div>
  )
}

export function ErrorState({ message }) {
  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center text-sm text-rose-300">
      {message || 'Something went wrong while loading this data.'}
    </div>
  )
}

export function SectionTitle({ title, subtitle, right }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
