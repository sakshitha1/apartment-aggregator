import { useEffect, useMemo, useState } from 'react'
import { fetchListings } from '../api/listings.js'
import { MOCK_LISTINGS } from '../data/mockListings.js'

function buildFallbackDataset() {
  const out = []
  for (let i = 0; i < 30; i += 1) {
    for (const l of MOCK_LISTINGS) {
      out.push({
        ...l,
        id: `${l.id}-${i}`,
        price: l.price + (i % 5) * 1500,
        isNew: i % 7 === 0 ? true : l.isNew,
      })
    }
  }
  return out
}

const FALLBACK_DATASET = buildFallbackDataset()

export function useListings(filters) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [source, setSource] = useState('api') // 'api' | 'mock'

  const stableKey = useMemo(() => JSON.stringify(filters || {}), [filters])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    setSource('api')

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
        // Fallback to mock dataset while backend is absent.
        setError(e)
        setSource('mock')
        const elapsed = Date.now() - start
        const delay = Math.max(0, 400 - elapsed)
        setTimeout(() => {
          if (!alive) return
          setData(FALLBACK_DATASET)
          setLoading(false)
        }, delay)
      })

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey])

  return { data, loading, error, source }
}

