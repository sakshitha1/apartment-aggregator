import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'

const FavoritesContext = createContext(null)
const LS_KEY = 'rea.favorites'

function loadFavorites() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function FavoritesProvider({ children }) {
  const [ids, setIds] = useState(loadFavorites)
  const { user } = useAuth()

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(ids))
  }, [ids])

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('rea.auth.token')
      fetch('/api/user/saved', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const savedIds = data.filter((d) => d.type === 'saved').map((d) => d.zpid)
            setIds(savedIds)
          }
        })
        .catch(() => {})
    } else {
      setIds(loadFavorites())
    }
  }, [user])

  const toggle = useCallback(
    (id) => {
      const willBeFav = !ids.includes(id)
      setIds((prev) => (willBeFav ? [...prev, id] : prev.filter((x) => x !== id)))
      
      const token = localStorage.getItem('rea.auth.token')
      if (token) {
        fetch('/api/user/saved', {
          method: willBeFav ? 'POST' : 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ zpid: id, type: 'saved' }),
        }).catch(() => {})
      }
    },
    [ids]
  )

  const isFavorite = useCallback((id) => ids.includes(id), [ids])

  return (
    <FavoritesContext.Provider value={{ ids, toggle, isFavorite, count: ids.length }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
