import { createContext, useCallback, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext.jsx'

const CompareContext = createContext(null)
const MAX_COMPARE = 4

export function CompareProvider({ children }) {
  const [ids, setIds] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('rea.auth.token')
      fetch('/api/user/saved', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const arr = data.filter((d) => d.type === 'compared').map((d) => d.zpid).slice(0, MAX_COMPARE)
            setIds(arr)
          }
        })
        .catch(() => {})
    } else {
      setIds([])
    }
  }, [user])

  const add = useCallback((id) => {
    if (ids.includes(id)) return
    if (ids.length >= MAX_COMPARE) return
    setIds((prev) => [...prev, id])
    const token = localStorage.getItem('rea.auth.token')
    if (token) {
      fetch('/api/user/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ zpid: id, type: 'compared' }),
      }).catch(() => {})
    }
  }, [ids])

  const remove = useCallback((id) => {
    setIds((prev) => prev.filter((x) => x !== id))
    const token = localStorage.getItem('rea.auth.token')
    if (token) {
      fetch('/api/user/saved', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ zpid: id, type: 'compared' }),
      }).catch(() => {})
    }
  }, [])

  const toggle = useCallback((id) => {
    const willAdd = !ids.includes(id)
    if (willAdd && ids.length >= MAX_COMPARE) return
    
    setIds((prev) => willAdd ? [...prev, id] : prev.filter((x) => x !== id))

    const token = localStorage.getItem('rea.auth.token')
    if (token) {
      fetch('/api/user/saved', {
        method: willAdd ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ zpid: id, type: 'compared' }),
      }).catch(() => {})
    }
  }, [ids])

  const clear = useCallback(() => {
    setIds([])
    // We could iterate over ids and DELETE if we want, ignoring for now as it's not strictly necessary. 
  }, [])

  const isInCompare = useCallback((id) => ids.includes(id), [ids])

  return (
    <CompareContext.Provider
      value={{ ids, add, remove, toggle, clear, isInCompare, count: ids.length, max: MAX_COMPARE }}
    >
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be used within CompareProvider')
  return ctx
}
