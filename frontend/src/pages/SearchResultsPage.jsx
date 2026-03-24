import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FilterBar } from '../components/FilterBar.jsx'
import { ListingCard } from '../components/ListingCard.jsx'
import { FilterSkeleton, ListingCardSkeleton } from '../components/Skeletons.jsx'
import { PageFade } from '../components/PageFade.jsx'
import { NaturalSearchBar } from '../components/NaturalSearchBar.jsx'
import { useListings } from '../hooks/useListings.js'
import { computePreferenceMatch } from '../components/PreferenceMatcher.jsx'

export function SearchResultsPage() {
  const [params, setParams] = useSearchParams()

  const filtersFromUrl = useMemo(() => {
    return {
      maxPrice: Number(params.get('maxPrice') || 5000000),
      minPrice: Number(params.get('minPrice') || 0),
      rooms: params.get('rooms') || 'any',
      bathrooms: params.get('bathrooms') || 'any',
      category: params.get('category') || 'any',
      homeStatus: params.get('homeStatus') || 'any',
      state: params.get('state') || 'any',
      minArea: params.get('minArea') || '',
      maxArea: params.get('maxArea') || '',
      yearBuiltMin: params.get('yearBuiltMin') || '',
      yearBuiltMax: params.get('yearBuiltMax') || '',
      minValueScore: params.get('minValueScore') || '',
      county: params.get('county') || '',
      sort: params.get('sort') || 'recommended',
      q: params.get('q') || '',
    }
  }, [params])

  const [filters, setFilters] = useState(filtersFromUrl)
  const [showNlSearch, setShowNlSearch] = useState(false)
  const [nlKeywords, setNlKeywords] = useState('')

  useEffect(() => {
    setFilters(filtersFromUrl)
  }, [filtersFromUrl])

  useEffect(() => {
    const next = new URLSearchParams()
    if (filters.maxPrice < 5000000) next.set('maxPrice', String(filters.maxPrice))
    if (Number(filters.minPrice) > 0) next.set('minPrice', String(filters.minPrice))
    if (filters.rooms && filters.rooms !== 'any') next.set('rooms', filters.rooms)
    if (filters.bathrooms && filters.bathrooms !== 'any') next.set('bathrooms', filters.bathrooms)
    if (filters.category && filters.category !== 'any') next.set('category', filters.category)
    if (filters.homeStatus && filters.homeStatus !== 'any') next.set('homeStatus', filters.homeStatus)
    if (filters.state && filters.state !== 'any') next.set('state', filters.state)
    if (filters.minArea) next.set('minArea', String(filters.minArea))
    if (filters.maxArea) next.set('maxArea', String(filters.maxArea))
    if (filters.yearBuiltMin) next.set('yearBuiltMin', String(filters.yearBuiltMin))
    if (filters.yearBuiltMax) next.set('yearBuiltMax', String(filters.yearBuiltMax))
    if (filters.minValueScore) next.set('minValueScore', String(filters.minValueScore))
    if (filters.county) next.set('county', filters.county)
    if (filters.sort && filters.sort !== 'recommended') next.set('sort', filters.sort)
    if (filters.q) next.set('q', filters.q)
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const { data: dataset, total, loading, error } = useListings({
    maxPrice: filters.maxPrice >= 5000000 ? undefined : filters.maxPrice,
    minPrice: Number(filters.minPrice) > 0 ? filters.minPrice : undefined,
    rooms: filters.rooms,
    bathrooms: filters.bathrooms,
    category: filters.category,
    homeStatus: filters.homeStatus,
    state: filters.state,
    minArea: filters.minArea || undefined,
    maxArea: filters.maxArea || undefined,
    yearBuiltMin: filters.yearBuiltMin || undefined,
    yearBuiltMax: filters.yearBuiltMax || undefined,
    minValueScore: filters.minValueScore || undefined,
    county: filters.county || undefined,
    sort: filters.sort,
    q: filters.q,
  })
  const isInitialLoading = loading && (!dataset || dataset.length === 0)

  const filtered = useMemo(() => {
    const minRooms = filters.rooms === 'any' ? 0 : Number(filters.rooms)
    const minBath = filters.bathrooms === 'any' ? 0 : Number(filters.bathrooms)
    const maxPrice = filters.maxPrice >= 5000000 ? Number.POSITIVE_INFINITY : filters.maxPrice
    const base = (dataset || []).filter((l) => {
      if (filters.category !== 'any' && l.category !== filters.category) return false
      if (typeof l.price === 'number' && l.price > maxPrice) return false
      if (Number(filters.minPrice) > 0 && typeof l.price === 'number' && l.price < Number(filters.minPrice)) return false
      if (minRooms && (l.rooms || l.bedrooms || 0) < minRooms) return false
      if (minBath && (l.bathrooms || 0) < minBath) return false
      if (filters.state && filters.state !== 'any' && l.state !== filters.state) return false
      return true
    })

    const deduped = Array.from(
      new Map(base.filter((l) => l?.id != null).map((l) => [String(l.id), l])).values(),
    )

    const sorted = [...deduped]
    if (filters.sort === 'price_asc') sorted.sort((a, b) => a.price - b.price)
    if (filters.sort === 'price_desc') sorted.sort((a, b) => b.price - a.price)
    if (filters.sort === 'new') sorted.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
    if (filters.sort === 'value' || filters.sort === 'value_score') sorted.sort((a, b) => (b.valueScore || 0) - (a.valueScore || 0))
    if (filters.sort === 'match' && nlKeywords) {
      sorted.sort((a, b) => {
        const sa = computePreferenceMatch(a, nlKeywords)?.score ?? -1
        const sb = computePreferenceMatch(b, nlKeywords)?.score ?? -1
        return sb - sa
      })
    }
    return sorted
  }, [dataset, filters, nlKeywords])

  const [items, setItems] = useState([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor] = useState(0)
  const sentinelRef = useRef(null)

  const PAGE_SIZE = 12

  useEffect(() => {
    setCursor(0)
    setItems([])
    setItems(filtered.slice(0, PAGE_SIZE))
    setCursor(PAGE_SIZE)
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

  function handleNaturalApply(parsed, originalQuery) {
    setFilters((f) => {
      const next = { ...f }
      if (parsed.maxPrice != null) next.maxPrice = parsed.maxPrice
      if (parsed.minPrice != null) next.minPrice = parsed.minPrice
      if (parsed.category && parsed.category !== 'any') next.category = parsed.category
      if (parsed.rooms) next.rooms = parsed.rooms
      if (parsed.bathrooms) next.bathrooms = parsed.bathrooms
      if (parsed.state) next.state = parsed.state
      if (parsed.homeStatus) next.homeStatus = parsed.homeStatus
      if (parsed.sort) next.sort = parsed.sort
      else next.sort = 'match'
      if (parsed.minArea) next.minArea = parsed.minArea
      if (parsed.maxArea) next.maxArea = parsed.maxArea
      if (parsed.yearBuiltMin) next.yearBuiltMin = parsed.yearBuiltMin
      if (parsed.yearBuiltMax) next.yearBuiltMax = parsed.yearBuiltMax
      if (parsed.county) next.county = parsed.county
      if (parsed.minValueScore) next.minValueScore = parsed.minValueScore
      if (parsed.q) next.q = parsed.q
      return next
    })
    if (originalQuery) setNlKeywords(originalQuery)
  }

  return (
    <PageFade>
      <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Search results</h1>
            <div className="text-sm text-zinc-600">
              {isInitialLoading
                ? 'Loading…'
                : total > 0
                  ? `Showing ${filtered.length} of ${total} properties`
                  : `${filtered.length} properties`}
            </div>
            {!loading && error ? (
              <div className="mt-1 text-xs text-red-500">
                Could not reach the backend. Make sure the API server is running.
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {nlKeywords && (
              <div className="hidden items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 md:flex">
                <span>✨ Matching: "{nlKeywords.length > 30 ? nlKeywords.slice(0, 30) + '…' : nlKeywords}"</span>
                <button
                  type="button"
                  onClick={() => { setNlKeywords(''); setFilters((f) => ({ ...f, sort: 'recommended' })) }}
                  className="ml-0.5 rounded-full hover:text-rose-900"
                  title="Clear AI match"
                >
                  ×
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowNlSearch((v) => !v)}
              className={`hidden items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition md:flex ${
                showNlSearch
                  ? 'border-rose-300 bg-rose-50 text-rose-600'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              ✨ Smart Search
            </button>

            {!loading ? (
              <label className="hidden items-center gap-2 text-sm md:flex">
                <span className="text-zinc-600">Sort</span>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                >
                  {nlKeywords && <option value="match">Best Match %</option>}
                  <option value="recommended">Recommended</option>
                  <option value="value_score">Best Value Score</option>
                  <option value="new">Newest</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                </select>
              </label>
            ) : null}
          </div>
        </div>

        {showNlSearch && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-xs font-semibold text-zinc-600">Describe what you're looking for in plain language</div>
            <NaturalSearchBar onApply={handleNaturalApply} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr] lg:items-start lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
        <div className="lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
          {isInitialLoading ? <FilterSkeleton /> : <FilterBar filters={filters} onChange={setFilters} />}
        </div>

        <div className="space-y-4 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:pr-1">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isInitialLoading
              ? Array.from({ length: 9 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))
              : items.map((l) => <ListingCard key={l.id} listing={l} nlKeywords={nlKeywords || undefined} />)}
          </div>

          {!isInitialLoading ? (
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
                  You've reached the end.
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
