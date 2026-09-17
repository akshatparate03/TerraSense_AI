import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck, Loader2 } from 'lucide-react'
import AuthShell from '../../components/AuthShell.jsx'
import { authVerifyOtp, authResendOtp } from '../../services/api.js'

export default function VerifyOtp() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || ''
  const [otp, setOtp] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  if (!email) {
    return (
      <AuthShell title="Verify your email">
        <p className="text-center text-sm text-slate-500">
          No pending registration found. Please{' '}
          <a href="/register" className="text-accent-cyan hover:underline">register</a> first.
        </p>
      </AuthShell>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authVerifyOtp(email, otp)
      navigate('/set-password', { state: { email } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed.')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setResending(true)
    setError(null)
    setInfo(null)
    try {
      await authResendOtp(email)
      setInfo('A new code has been sent to your email.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not resend code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell title="Verify your email" subtitle={`Enter the 6-digit code sent to ${email}`}>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          placeholder="••••••"
          autoFocus
          className="w-full rounded-lg border border-base-600 bg-base-800/60 px-3 py-3 text-center text-2xl tracking-[0.5em] text-slate-100 outline-none focus:border-accent-cyan/50"
        />
        {error && <p className="text-xs text-rose-400">{error}</p>}
        {info && <p className="text-xs text-emerald-400">{info}</p>}
        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-4 py-3 text-sm font-semibold text-base-950 shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Verify Code
        </button>
      </form>
      <button
        onClick={resend}
        disabled={resending}
        className="mt-4 w-full text-center text-sm text-accent-cyan hover:underline disabled:opacity-50"
      >
        {resending ? 'Resending...' : "Didn't get a code? Resend"}
      </button>
    </AuthShell>
  )
}
