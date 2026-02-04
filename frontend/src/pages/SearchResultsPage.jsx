import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FilterBar } from '../components/FilterBar.jsx'
import { ListingCard } from '../components/ListingCard.jsx'
import { FilterSkeleton, ListingCardSkeleton } from '../components/Skeletons.jsx'
import { PageFade } from '../components/PageFade.jsx'
import { useListings } from '../hooks/useListings.js'

export function SearchResultsPage() {
  const [params, setParams] = useSearchParams()

  const filtersFromUrl = useMemo(() => {
    return {
      maxPrice: Number(params.get('maxPrice') || 50000),
      rooms: params.get('rooms') || 'any',
      hasPhotos: (params.get('hasPhotos') || '1') === '1',
      category: params.get('category') || 'any',
      sort: params.get('sort') || 'recommended', // 'recommended' | 'price_asc' | 'price_desc' | 'new'
    }
  }, [params])

  const [filters, setFilters] = useState(filtersFromUrl)

  useEffect(() => {
    setFilters(filtersFromUrl)
  }, [filtersFromUrl])

  // Keep URL in sync (shareable/searchable)
  useEffect(() => {
    const next = new URLSearchParams(params)
    next.set('maxPrice', String(filters.maxPrice))
    next.set('rooms', String(filters.rooms))
    next.set('hasPhotos', filters.hasPhotos ? '1' : '0')
    next.set('category', filters.category || 'any')
    next.set('sort', filters.sort || 'recommended')
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const { data: dataset, loading, source } = useListings({
    maxPrice: filters.maxPrice,
    rooms: filters.rooms,
    hasPhotos: filters.hasPhotos ? 1 : 0,
    category: filters.category,
    sort: filters.sort,
  })

  const filtered = useMemo(() => {
    // If API returns already-filtered data, this is a no-op for most cases.
    const minRooms = filters.rooms === 'any' ? 0 : Number(filters.rooms)
    const base = (dataset || []).filter((l) => {
      if (filters.category !== 'any' && l.category !== filters.category) return false
      if (typeof l.price === 'number' && l.price > filters.maxPrice) return false
      if (minRooms && l.rooms < minRooms) return false
      if (filters.hasPhotos && !l.hasPhotos) return false
      return true
    })

    const sorted = [...base]
    if (filters.sort === 'price_asc') sorted.sort((a, b) => a.price - b.price)
    if (filters.sort === 'price_desc') sorted.sort((a, b) => b.price - a.price)
    if (filters.sort === 'new') sorted.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
    return sorted
  }, [dataset, filters])

  const [items, setItems] = useState([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor] = useState(0)
  const sentinelRef = useRef(null)

  const PAGE_SIZE = 12

  useEffect(() => {
    // Reset results on list change
    let alive = true
    setCursor(0)
    setItems([])

    const t = setTimeout(() => {
      if (!alive) return
      setItems(filtered.slice(0, PAGE_SIZE))
      setCursor(PAGE_SIZE)
    }, 600)

    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [filtered])

  useEffect(() => {
    if (!sentinelRef.current) return
    const el = sentinelRef.current

    const obs = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((e) => e.isIntersecting)
        if (!isVisible) return
        if (loading || loadingMore) return
        if (cursor >= filtered.length) return

        setLoadingMore(true)
        setTimeout(() => {
          setItems((prev) => [
            ...prev,
            ...filtered.slice(cursor, cursor + PAGE_SIZE),
          ])
          setCursor((c) => c + PAGE_SIZE)
          setLoadingMore(false)
        }, 650)
      },
      { rootMargin: '200px' },
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [cursor, filtered, loading, loadingMore])

  return (
    <PageFade>
      <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Search results</h1>
          <div className="text-sm text-zinc-600">
            {loading ? 'Loading…' : `${filtered.length} homes found`}
          </div>
          {!loading && source === 'mock' ? (
            <div className="mt-1 text-xs text-zinc-500">
              Showing demo data (set `VITE_API_BASE_URL` to use your backend).
            </div>
          ) : null}
        </div>

        {!loading ? (
          <label className="hidden items-center gap-2 text-sm md:flex">
            <span className="text-zinc-600">Sort</span>
            <select
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="recommended">Recommended</option>
              <option value="new">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </label>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr] lg:items-start">
        <div className="lg:sticky lg:top-20">
          {loading ? (
            <FilterSkeleton />
          ) : (
            <FilterBar filters={filters} onChange={setFilters} />
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 9 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))
              : items.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>

          {!loading ? (
            <>
              <div ref={sentinelRef} className="h-10" />
              {loadingMore ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ListingCardSkeleton key={`more-${i}`} />
                  ))}
                </div>
              ) : cursor >= filtered.length ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center text-sm text-zinc-600">
                  You’ve reached the end.
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
      </div>
    </PageFade>
  )
}

