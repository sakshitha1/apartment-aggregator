import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageFade } from '../components/PageFade.jsx'
import { ValueScoreBadge } from '../components/ValueScoreBadge.jsx'
import { MarketLabel } from '../components/MarketLabel.jsx'
import { useCompare } from '../context/CompareContext.jsx'
import { fetchListingsBatch } from '../api/listings.js'
import { formatPrice } from '../data/mockListings.js'

function Winner({ children }) {
  return (
    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
      {children} <span className="text-[10px] bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5 font-bold">BEST</span>
    </span>
  )
}

function Cell({ children, isBest, isWorst }) {
  return (
    <td
      className={`px-4 py-3 text-sm text-center border-l border-zinc-100 ${
        isBest ? 'bg-emerald-50' : isWorst ? 'bg-rose-50' : ''
      }`}
    >
      {children}
    </td>
  )
}

function Row({ label, listings, accessor, format, higherIsBetter = true, noCompare = false }) {
  const values = listings.map(accessor)
  const numericValues = values.map((v) => (typeof v === 'number' ? v : null))
  const validNums = numericValues.filter((v) => v != null && !isNaN(v))

  let bestIdx = -1
  let worstIdx = -1

  if (!noCompare && validNums.length >= 2) {
    const best = higherIsBetter ? Math.max(...validNums) : Math.min(...validNums)
    const worst = higherIsBetter ? Math.min(...validNums) : Math.max(...validNums)
    bestIdx = numericValues.indexOf(best)
    if (best !== worst) worstIdx = numericValues.indexOf(worst)
  }

  return (
    <tr className="border-t border-zinc-100 hover:bg-zinc-50/50 transition">
      <td className="sticky left-0 bg-white px-4 py-3 text-xs font-semibold text-zinc-500 whitespace-nowrap border-r border-zinc-100">
        {label}
      </td>
      {listings.map((l, i) => {
        const val = values[i]
        const isBest = i === bestIdx
        const isWorst = i === worstIdx
        return (
          <Cell key={l.id} isBest={isBest} isWorst={isWorst}>
            {isBest && !noCompare && validNums.length >= 2 ? (
              <Winner>{format ? format(val, l) : (val ?? '—')}</Winner>
            ) : (
              format ? format(val, l) : (val ?? '—')
            )}
          </Cell>
        )
      })}
    </tr>
  )
}

export function ComparePage() {
  const [searchParams] = useSearchParams()
  const { clear } = useCompare()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []
    if (!ids.length) { setLoading(false); return }
    setLoading(true)
    fetchListingsBatch(ids)
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [searchParams])

  if (loading) {
    return (
      <PageFade>
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-zinc-200" />
          <div className="h-64 animate-pulse rounded-3xl bg-zinc-200" />
        </div>
      </PageFade>
    )
  }

  if (!listings.length) {
    return (
      <PageFade>
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center">
          <div className="text-4xl mb-3">⚖️</div>
          <div className="text-lg font-semibold">No listings to compare</div>
          <div className="mt-2 text-sm text-zinc-500">
            Go to <Link className="font-semibold text-rose-600" to="/search">Search</Link> and use the Compare button on listing cards.
          </div>
        </div>
      </PageFade>
    )
  }

  const pricePerSqft = (l) =>
    l.price && l.livingArea ? Math.round(l.price / l.livingArea) : null

  const daysAgo = (dateStr) => {
    if (!dateStr) return null
    try {
      return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    } catch { return null }
  }

  return (
    <PageFade>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Compare Listings</h1>
            <div className="text-sm text-zinc-500">{listings.length} properties</div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { clear() }}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              Clear compare
            </button>
            <Link
              to="/search"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              ← Back to search
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="sticky left-0 bg-zinc-50 px-4 py-3 text-left text-xs font-semibold text-zinc-500 whitespace-nowrap border-r border-zinc-200">
                  Property
                </th>
                {listings.map((l) => (
                  <th key={l.id} className="px-4 py-3 text-center border-l border-zinc-200 min-w-[200px]">
                    <Link
                      to={`/listing/${l.id}`}
                      className="block space-y-1 hover:text-rose-600 transition"
                    >
                      <div className="text-2xl">{getCategoryIcon(l.category)}</div>
                      <div className="text-xs font-semibold text-zinc-900 line-clamp-2">{l.title}</div>
                      <div className="text-[11px] text-zinc-500 line-clamp-1">{l.city}, {l.state}</div>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Value indicators */}
              <tr className="border-t border-zinc-100 bg-zinc-50/30">
                <td className="sticky left-0 bg-zinc-50/30 px-4 py-3 text-xs font-semibold text-zinc-500 border-r border-zinc-100">
                  Value Score
                </td>
                {listings.map((l) => (
                  <td key={l.id} className="px-4 py-3 text-center border-l border-zinc-100">
                    <ValueScoreBadge score={l.valueScore} size="sm" showLabel />
                  </td>
                ))}
              </tr>
              <tr className="border-t border-zinc-100">
                <td className="sticky left-0 bg-white px-4 py-3 text-xs font-semibold text-zinc-500 border-r border-zinc-100">
                  Market Position
                </td>
                {listings.map((l) => (
                  <td key={l.id} className="px-4 py-3 text-center border-l border-zinc-100">
                    <MarketLabel label={l.marketLabel} />
                  </td>
                ))}
              </tr>

              <Row
                label="Price"
                listings={listings}
                accessor={(l) => l.price}
                format={(v) => v ? formatPrice(v) : '—'}
                higherIsBetter={false}
              />
              <Row
                label="Price / sqft"
                listings={listings}
                accessor={pricePerSqft}
                format={(v) => v ? `$${v}/sqft` : '—'}
                higherIsBetter={false}
              />
              <Row
                label="Living Area"
                listings={listings}
                accessor={(l) => l.livingArea}
                format={(v) => v ? `${v.toLocaleString()} sqft` : '—'}
                higherIsBetter
              />
              <Row
                label="Bedrooms"
                listings={listings}
                accessor={(l) => l.bedrooms || null}
                format={(v) => v ? `${v} bed` : '—'}
                higherIsBetter
              />
              <Row
                label="Bathrooms"
                listings={listings}
                accessor={(l) => l.bathrooms || null}
                format={(v) => v ? `${v} bath` : '—'}
                higherIsBetter
              />
              <Row
                label="Year Built"
                listings={listings}
                accessor={(l) => l.yearBuilt || null}
                format={(v) => v || '—'}
                higherIsBetter
              />
              <Row
                label="City Median"
                listings={listings}
                accessor={(l) => l.cityStats?.median || null}
                format={(v, l) =>
                  v ? (
                    <span>
                      {formatPrice(v)}
                      {l.price > 0 && (
                        <span className={`ml-1 text-[10px] ${l.price < v ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ({l.price < v ? '-' : '+'}{Math.abs(Math.round(((l.price - v) / v) * 100))}%)
                        </span>
                      )}
                    </span>
                  ) : '—'
                }
                noCompare
              />
              <Row
                label="Days Listed"
                listings={listings}
                accessor={(l) => daysAgo(l.datePosted)}
                format={(v) => v != null ? `${v}d ago` : '—'}
                higherIsBetter={false}
              />
              <Row
                label="Property Type"
                listings={listings}
                accessor={(l) => l.homeType || '—'}
                format={(v) => v}
                noCompare
              />
              <Row
                label="Status"
                listings={listings}
                accessor={(l) => l.homeStatus || '—'}
                format={(v) => v}
                noCompare
              />
              <Row
                label="Page Views"
                listings={listings}
                accessor={(l) => l.pageViewCount || null}
                format={(v) => v != null ? v.toLocaleString() : '—'}
                higherIsBetter
              />
              <Row
                label="Tax Rate"
                listings={listings}
                accessor={(l) => l.propertyTaxRate || null}
                format={(v) => v ? `${v}%` : '—'}
                higherIsBetter={false}
              />
              <Row
                label="County"
                listings={listings}
                accessor={(l) => l.county || '—'}
                format={(v) => v}
                noCompare
              />
              <Row
                label="Rent Estimate"
                listings={listings}
                accessor={(l) => l.rentZestimate || null}
                format={(v) => v ? formatPrice(v) + '/mo' : '—'}
                higherIsBetter
              />

              {/* CTA row */}
              <tr className="border-t border-zinc-200 bg-zinc-50">
                <td className="sticky left-0 bg-zinc-50 px-4 py-3 border-r border-zinc-200" />
                {listings.map((l) => (
                  <td key={l.id} className="px-4 py-3 text-center border-l border-zinc-200">
                    <Link
                      to={`/listing/${l.id}`}
                      className="inline-block rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition"
                    >
                      View Details →
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-500">
          <strong className="text-zinc-700">How to read:</strong> Green highlight = best value in that category.
          Red = worst. Value Score combines price vs city median (40%), living area (20%), listing freshness (20%), and popularity (20%).
        </div>
      </div>
    </PageFade>
  )
}

function getCategoryIcon(category) {
  const icons = {
    apartment: '🏢', condo: '🏬', 'single-family': '🏡',
    'multi-family': '🏘️', townhouse: '🏠', manufactured: '🏭', lot: '🌳',
  }
  return icons[category] || '🏠'
}
