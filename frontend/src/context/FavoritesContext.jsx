import { createContext, useCallback, useContext, useEffect, useState } from 'react'

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

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(ids))
  }, [ids])

  const toggle = useCallback((id) => {
    setIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

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
