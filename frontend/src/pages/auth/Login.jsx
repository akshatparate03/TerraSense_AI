import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Loader2 } from 'lucide-react'
import AuthShell from '../../components/AuthShell.jsx'
import GoogleSignInButton from '../../components/GoogleSignInButton.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async (credential) => {
    setError(null)
    try {
      await loginWithGoogle(credential)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Google sign-in failed.')
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your TerraSense AI account">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} required autoFocus />
        <Field label="Password" type="password" value={password} onChange={setPassword} required />
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-accent-cyan hover:underline">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-4 py-3 text-sm font-semibold text-base-950 shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          Log In
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-600">
        <div className="h-px flex-1 bg-base-700" /> OR <div className="h-px flex-1 bg-base-700" />
      </div>

      <GoogleSignInButton onCredential={handleGoogle} />

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-accent-cyan hover:underline">
          Register
        </Link>
      </p>
    </AuthShell>
  )
}

export function Field({ label, type = 'text', value, onChange, required, autoFocus }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-base-600 bg-base-800/60 px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-all focus:border-accent-cyan/60 focus:ring-2 focus:ring-accent-cyan/20"
      />
    </div>
  )
}
