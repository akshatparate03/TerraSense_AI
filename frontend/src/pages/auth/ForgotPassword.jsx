import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Loader2 } from 'lucide-react'
import AuthShell from '../../components/AuthShell.jsx'
import { Field } from './Login.jsx'
import { authForgotPassword } from '../../services/api.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authForgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Forgot password?" subtitle="Enter your registered email and we'll send you a reset link">
      {sent ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-300">
          If an account with that email exists, a password reset link has been sent. Please check your inbox.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Registered Email" type="email" value={email} onChange={setEmail} required autoFocus />
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-4 py-3 text-sm font-semibold text-base-950 shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send Reset Link
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="font-medium text-accent-cyan hover:underline">
          Back to login
        </Link>
      </p>
    </AuthShell>
  )
}
