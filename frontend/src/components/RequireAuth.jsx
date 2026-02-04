import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function RequireAuth({ children }) {
  const { user, openLogin } = useAuth()
  const location = useLocation()

  if (!user) {
    // Keep user context: open modal and send them home (so content remains visible).
    queueMicrotask(() => openLogin())
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return children
}

