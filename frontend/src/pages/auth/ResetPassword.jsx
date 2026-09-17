import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Check, X, KeyRound, Loader2 } from 'lucide-react'
import AuthShell from '../../components/AuthShell.jsx'
import { authResetPassword } from '../../services/api.js'

const CLIENT_RULES = [
  { label: 'At least 8 characters long', test: (p) => p.length >= 8 },
  { label: 'At least one uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'At least one lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { label: 'At least one digit (0-9)', test: (p) => /[0-9]/.test(p) },
  { label: 'At least one special character', test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
  { label: 'No spaces allowed', test: (p) => !/\s/.test(p) && p.length > 0 },
  { label: 'Maximum 64 characters', test: (p) => p.length <= 64 && p.length > 0 },
]

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''
  const email = params.get('email') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!token || !email) {
    return (
      <AuthShell title="Reset password">
        <p className="text-center text-sm text-slate-500">
          This reset link is invalid or incomplete. Please request a new one from{' '}
          <Link to="/forgot-password" className="text-accent-cyan hover:underline">Forgot Password</Link>.
        </p>
      </AuthShell>
    )
  }

  const allValid = CLIENT_RULES.every((r) => r.test(password))
  const passwordsMatch = password.length > 0 && password === confirm

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!allValid || !passwordsMatch) {
      setError('Please satisfy all password requirements and matching confirmation.')
      return
    }
    setLoading(true)
    try {
      await authResetPassword(token, email, password, confirm)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthShell title="Password reset!">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-300">
          Your password has been updated. Redirecting to login...
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Reset your password" subtitle={`For ${email}`}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-base-600 bg-base-800/60 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-accent-cyan/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Confirm New Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-base-600 bg-base-800/60 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-accent-cyan/50"
          />
          {confirm.length > 0 && (
            <p className={`mt-1 text-xs ${passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
              {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-base-700/60 bg-base-800/40 p-3">
          <ul className="space-y-1">
            {CLIENT_RULES.map((r) => {
              const ok = r.test(password)
              return (
                <li key={r.label} className={`flex items-center gap-2 text-xs ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  {r.label}
                </li>
              )
            })}
          </ul>
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={loading || !allValid || !passwordsMatch}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-4 py-3 text-sm font-semibold text-base-950 shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Reset Password
        </button>
      </form>
    </AuthShell>
  )
}
