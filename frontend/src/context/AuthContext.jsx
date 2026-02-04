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

    const login = ({ email }) => {
      const next = { id: crypto.randomUUID(), email, name: email.split('@')[0] }
      setUser(next)
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      closeAuthModal()
    }

    const register = ({ name, email }) => {
      const next = {
        id: crypto.randomUUID(),
        email,
        name: name?.trim() ? name.trim() : email.split('@')[0],
      }
      setUser(next)
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      closeAuthModal()
    }

    const logout = () => {
      setUser(null)
      localStorage.removeItem(LS_KEY)
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
