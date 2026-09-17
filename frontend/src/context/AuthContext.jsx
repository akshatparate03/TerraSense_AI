import React, { createContext, useContext, useEffect, useState } from 'react'
import { authLogin, authMe, authGoogleLogin } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('terrasense_token')
    if (!token) {
      setLoading(false)
      return
    }
    authMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('terrasense_token')
      })
      .finally(() => setLoading(false))
  }, [])

  const applySession = (data) => {
    localStorage.setItem('terrasense_token', data.access_token)
    localStorage.setItem('terrasense_user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const login = async (email, password) => {
    const data = await authLogin(email, password)
    applySession(data)
    return data
  }

  const loginWithGoogle = async (idToken) => {
    const data = await authGoogleLogin(idToken)
    applySession(data)
    return data
  }

  const logout = () => {
    localStorage.removeItem('terrasense_token')
    localStorage.removeItem('terrasense_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, applySession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
