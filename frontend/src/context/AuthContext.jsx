import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const LS_KEY = 'rea.auth.user'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const existing = safeParse(localStorage.getItem(LS_KEY))
    return existing?.id ? existing : null
  })
  const [authModal, setAuthModal] = useState(null) // 'login' | 'register' | null

  const value = useMemo(() => {
    const openLogin = () => setAuthModal('login')
    const openRegister = () => setAuthModal('register')
    const closeAuthModal = () => setAuthModal(null)

    const login = async ({ nickname, password }) => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Login failed')
        const next = data.user
        setUser(next)
        localStorage.setItem(LS_KEY, JSON.stringify(next))
        localStorage.setItem('rea.auth.token', data.token)
        closeAuthModal()
      } catch (err) {
        throw err // Will be caught by modal
      }
    }

    const register = async ({ nickname, password }) => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Registration failed')
        const next = data.user
        setUser(next)
        localStorage.setItem(LS_KEY, JSON.stringify(next))
        localStorage.setItem('rea.auth.token', data.token)
        closeAuthModal()
      } catch (err) {
        throw err // caught by modal
      }
    }

    const logout = () => {
      setUser(null)
      localStorage.removeItem(LS_KEY)
      localStorage.removeItem('rea.auth.token')
      localStorage.removeItem('rea.favorites')
      localStorage.removeItem('rea.compare')
      localStorage.removeItem('rea.preferences')
      localStorage.removeItem('rea.alerts.seen')
      window.location.href = '/'
    }

    return {
      user,
      authModal,
      openLogin,
      openRegister,
      closeAuthModal,
      login,
      register,
      logout,
    }
  }, [user, authModal])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
