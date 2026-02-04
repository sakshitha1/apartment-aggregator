import { useEffect, useState } from 'react'
import { fetchListingById } from '../api/listings.js'
import { MOCK_LISTINGS } from '../data/mockListings.js'

export function useListing(id) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [source, setSource] = useState('api') // 'api' | 'mock'

  useEffect(() => {
    if (!id) return
    let alive = true
    setLoading(true)
    setError(null)
    setSource('api')

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
        setSource('mock')
        const fallback = MOCK_LISTINGS.find((l) => l.id === id) || null
        const elapsed = Date.now() - start
        const delay = Math.max(0, 350 - elapsed)
        setTimeout(() => {
          if (!alive) return
          setData(fallback)
          setLoading(false)
        }, delay)
      })

    return () => {
      alive = false
    }
  }, [id])

  return { data, loading, error, source }
}

