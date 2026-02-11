import { useEffect, useMemo, useState } from 'react'
import { fetchListings } from '../api/listings.js'

export function useListings(filters) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const stableKey = useMemo(() => JSON.stringify(filters || {}), [filters])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)

    // Keep skeletons even for fast responses
    const start = Date.now()

    fetchListings(filters || {})
      .then((items) => {
        if (!alive) return
        const elapsed = Date.now() - start
        const delay = Math.max(0, 400 - elapsed)
        setTimeout(() => {
          if (!alive) return
          setData(items || [])
          setLoading(false)
        }, delay)
      })
      .catch((e) => {
        if (!alive) return
        setError(e)
        const elapsed = Date.now() - start
        const delay = Math.max(0, 400 - elapsed)
        setTimeout(() => {
          if (!alive) return
          setData([])
          setLoading(false)
        }, delay)
      })

    return () => {
      alive = false
    }
  }, [stableKey])

  return { data, loading, error }
}

