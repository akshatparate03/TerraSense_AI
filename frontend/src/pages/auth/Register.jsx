import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Loader2 } from 'lucide-react'
import AuthShell from '../../components/AuthShell.jsx'
import GoogleSignInButton from '../../components/GoogleSignInButton.jsx'
import { Field } from './Login.jsx'
import { authRegister } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Register() {
  const navigate = useNavigate()
  const { loginWithGoogle } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authRegister(name, email)
      navigate('/verify-otp', { state: { email } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
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
    <AuthShell title="Create your account" subtitle="We'll email you a one-time code to verify it's really you">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full Name" value={name} onChange={setName} required autoFocus />
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue px-4 py-3 text-sm font-semibold text-base-950 shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Send Verification Code
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-600">
        <div className="h-px flex-1 bg-base-700" /> OR <div className="h-px flex-1 bg-base-700" />
      </div>

      <GoogleSignInButton onCredential={handleGoogle} />

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent-cyan hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
