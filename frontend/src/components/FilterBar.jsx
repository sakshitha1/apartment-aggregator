import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { CATEGORIES } from '../data/mockListings.js'
import { fetchStates, fetchStatuses } from '../api/listings.js'

function SectionTitle({ children }) {
  return <div className="text-xs font-semibold tracking-wide text-zinc-700">{children}</div>
}

const selectCls =
  'h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
const inputCls =
  'h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'

function formatDollar(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}

export const DEFAULT_FILTERS = {
  q: '',
  category: 'any',
  homeStatus: 'any',
  state: 'any',
  minPrice: 0,
  maxPrice: 5000000,
  rooms: 'any',
  bathrooms: 'any',
  minArea: '',
  maxArea: '',
  yearBuiltMin: '',
  yearBuiltMax: '',
  minValueScore: '',
  county: '',
  sort: 'recommended',
}

export function FilterBar({ filters, onChange, className }) {
  const update = (patch) => onChange({ ...filters, ...patch })

  const [showMore, setShowMore] = useState(false)
  const [states, setStates] = useState([])
  const [statuses, setStatuses] = useState([])

  useEffect(() => {
    fetchStates().then(setStates).catch(() => {})
    fetchStatuses().then(setStatuses).catch(() => {})
  }, [])

  const moreActiveCount = [
    filters.homeStatus && filters.homeStatus !== 'any',
    filters.state && filters.state !== 'any',
    filters.bathrooms && filters.bathrooms !== 'any',
    filters.minArea && filters.minArea !== '',
    filters.maxArea && filters.maxArea !== '',
    filters.yearBuiltMin && filters.yearBuiltMin !== '',
    filters.yearBuiltMax && filters.yearBuiltMax !== '',
    filters.minPrice && Number(filters.minPrice) > 0,
    filters.minValueScore && filters.minValueScore !== '',
    filters.county && filters.county !== '',
  ].filter(Boolean).length

  const hasActiveFilters = Object.keys(DEFAULT_FILTERS).some((k) => {
    if (k === 'sort') return false
    const def = DEFAULT_FILTERS[k]
    const cur = filters[k]
    if (def === 'any') return cur !== undefined && cur !== 'any'
    if (def === '') return cur !== undefined && cur !== ''
    if (def === 0) return cur !== undefined && Number(cur) !== 0
    return cur !== undefined && cur !== def
  })

  return (
    <aside
      className={clsx(
        'space-y-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm',
        className,
      )}
    >
      {/* ── Search ── */}
      <div className="space-y-2">
        <SectionTitle>Search</SectionTitle>
        <input
          type="text"
          value={filters.q || ''}
          onChange={(e) => update({ q: e.target.value })}
          placeholder="City, address, county…"
          className={inputCls}
        />
      </div>

      {/* ── Type ── */}
      <div className="space-y-2">
        <SectionTitle>Property Type</SectionTitle>
        <select
          value={filters.category || 'any'}
          onChange={(e) => update({ category: e.target.value })}
          className={selectCls}
        >
          <option value="any">Any</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Price range ── */}
      <div className="space-y-2">
        <SectionTitle>Price Range</SectionTitle>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step={10000}
            value={filters.minPrice || ''}
            onChange={(e) => update({ minPrice: e.target.value === '' ? 0 : Number(e.target.value) })}
            placeholder="Min"
            className={clsx(inputCls, 'flex-1')}
          />
          <span className="text-xs text-zinc-400">–</span>
          <input
            type="number"
            min={0}
            step={10000}
            value={filters.maxPrice >= 5000000 ? '' : filters.maxPrice}
            onChange={(e) => update({ maxPrice: e.target.value === '' ? 5000000 : Number(e.target.value) })}
            placeholder="Max"
            className={clsx(inputCls, 'flex-1')}
          />
        </div>
        <input
          type="range"
          min={0}
          max={5000000}
          step={50000}
          value={filters.maxPrice}
          onChange={(e) => update({ maxPrice: Number(e.target.value) })}
          className="w-full accent-rose-500"
        />
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{filters.minPrice > 0 ? formatDollar(filters.minPrice) : '$0'}</span>
          <span className="font-semibold text-zinc-900">
            {filters.maxPrice >= 5000000 ? 'No limit' : formatDollar(filters.maxPrice)}
          </span>
          <span>$5M+</span>
        </div>
      </div>

      {/* ── Bedrooms ── */}
      <div className="space-y-2">
        <SectionTitle>Bedrooms</SectionTitle>
        <div className="flex gap-1">
          {['any', '1', '2', '3', '4', '5'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => update({ rooms: v })}
              className={clsx(
                'flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition',
                (filters.rooms || 'any') === v
                  ? 'border-rose-500 bg-rose-50 text-rose-600'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50',
              )}
            >
              {v === 'any' ? 'Any' : `${v}+`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sort ── */}
      <div className="space-y-2">
        <SectionTitle>Sort By</SectionTitle>
        <select
          value={filters.sort || 'recommended'}
          onChange={(e) => update({ sort: e.target.value })}
          className={selectCls}
        >
          <option value="recommended">Most Popular</option>
          <option value="value_score">Best Value Score</option>
          <option value="new">Newest Listings</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* ── More Filters (collapsible) ── */}
      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
      >
        <span>
          More Filters
          {moreActiveCount > 0 && (
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {moreActiveCount}
            </span>
          )}
        </span>
        <svg
          className={clsx('h-4 w-4 transition-transform', showMore && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMore && (
        <div className="space-y-5 border-t border-zinc-100 pt-4">
          {/* Bathrooms */}
          <div className="space-y-2">
            <SectionTitle>Bathrooms</SectionTitle>
            <div className="flex gap-1">
              {['any', '1', '2', '3', '4'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update({ bathrooms: v })}
                  className={clsx(
                    'flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition',
                    (filters.bathrooms || 'any') === v
                      ? 'border-rose-500 bg-rose-50 text-rose-600'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50',
                  )}
                >
                  {v === 'any' ? 'Any' : `${v}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <SectionTitle>Status</SectionTitle>
            <select
              value={filters.homeStatus || 'any'}
              onChange={(e) => update({ homeStatus: e.target.value })}
              className={selectCls}
            >
              <option value="any">Any</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* State */}
          <div className="space-y-2">
            <SectionTitle>State</SectionTitle>
            <select
              value={filters.state || 'any'}
              onChange={(e) => update({ state: e.target.value })}
              className={selectCls}
            >
              <option value="any">Any</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* County */}
          <div className="space-y-2">
            <SectionTitle>County</SectionTitle>
            <input
              type="text"
              value={filters.county || ''}
              onChange={(e) => update({ county: e.target.value })}
              placeholder="e.g. Los Angeles, Cook…"
              className={inputCls}
            />
          </div>

          {/* Living Area */}
          <div className="space-y-2">
            <SectionTitle>Living Area (sqft)</SectionTitle>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={100}
                value={filters.minArea || ''}
                onChange={(e) => update({ minArea: e.target.value })}
                placeholder="Min"
                className={clsx(inputCls, 'flex-1')}
              />
              <span className="text-xs text-zinc-400">–</span>
              <input
                type="number"
                min={0}
                step={100}
                value={filters.maxArea || ''}
                onChange={(e) => update({ maxArea: e.target.value })}
                placeholder="Max"
                className={clsx(inputCls, 'flex-1')}
              />
            </div>
          </div>

          {/* Year Built */}
          <div className="space-y-2">
            <SectionTitle>Year Built</SectionTitle>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1800}
                max={2026}
                value={filters.yearBuiltMin || ''}
                onChange={(e) => update({ yearBuiltMin: e.target.value })}
                placeholder="From"
                className={clsx(inputCls, 'flex-1')}
              />
              <span className="text-xs text-zinc-400">–</span>
              <input
                type="number"
                min={1800}
                max={2026}
                value={filters.yearBuiltMax || ''}
                onChange={(e) => update({ yearBuiltMax: e.target.value })}
                placeholder="To"
                className={clsx(inputCls, 'flex-1')}
              />
            </div>
          </div>

          {/* Minimum Value Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <SectionTitle>Min. Value Score</SectionTitle>
              {filters.minValueScore ? (
                <span className="text-xs font-bold text-rose-600">{filters.minValueScore}+</span>
              ) : (
                <span className="text-xs text-zinc-400">Any</span>
              )}
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={filters.minValueScore || 0}
              onChange={(e) => update({ minValueScore: e.target.value === '0' ? '' : e.target.value })}
              className="w-full accent-rose-500"
            />
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span>Any</span>
              <span>50 — Good</span>
              <span>75 — Great</span>
              <span>90+</span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Value Score reflects price vs. city median, size, freshness &amp; popularity (0–100).
            </p>
          </div>
        </div>
      )}

      {/* ── Reset ── */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_FILTERS, sort: filters.sort })}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100"
        >
          Reset all filters
        </button>
      )}
    </aside>
  )
}
