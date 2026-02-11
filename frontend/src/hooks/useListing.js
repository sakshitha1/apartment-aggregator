import { useEffect, useState } from 'react'
import { fetchListingById } from '../api/listings.js'

export function useListing(id) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    let alive = true
    setLoading(true)
    setError(null)

    const start = Date.now()

    fetchListingById(id)
      .then((item) => {
        if (!alive) return
        const elapsed = Date.now() - start
        const delay = Math.max(0, 350 - elapsed)
        setTimeout(() => {
          if (!alive) return
          setData(item || null)
          setLoading(false)
        }, delay)
      })
      .catch((e) => {
        if (!alive) return
        setError(e)
        const elapsed = Date.now() - start
        const delay = Math.max(0, 350 - elapsed)
        setTimeout(() => {
          if (!alive) return
          setData(null)
          setLoading(false)
        }, delay)
      })

    return () => {
      alive = false
    }
  }, [id])

  return { data, loading, error }
}

