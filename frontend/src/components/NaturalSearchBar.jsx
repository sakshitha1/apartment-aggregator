import { useState } from 'react'
import { parseNaturalQueryAI } from '../api/ai.js'

export function NaturalSearchBar({ onApply }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [appliedSummary, setAppliedSummary] = useState(null)

  async function handleAIParse() {
    if (query.trim().length <= 3) return
    setErrorMsg(null)
    setAppliedSummary(null)
    setLoading(true)

    try {
      const data = await parseNaturalQueryAI(query)

      const filters = {}

      if (data.category) filters.category = data.category
      if (data.state) filters.state = data.state
      if (data.homeStatus) filters.homeStatus = data.homeStatus
      if (data.sort) filters.sort = data.sort

      // Merge city + county + freeform q into the q search field
      const qParts = []
      if (data.city) qParts.push(data.city)
      if (data.county) {
        qParts.push(data.county)
        filters.county = data.county
      }
      if (data.q) qParts.push(data.q)
      if (qParts.length > 0) filters.q = qParts.join(' ')

      if (data.rooms) filters.rooms = String(data.rooms)
      if (data.bathrooms) filters.bathrooms = String(data.bathrooms)
      if (data.maxPrice) filters.maxPrice = data.maxPrice
      if (data.minPrice) filters.minPrice = data.minPrice
      if (data.minArea) filters.minArea = data.minArea
      if (data.maxArea) filters.maxArea = data.maxArea
      if (data.yearBuiltMin) filters.yearBuiltMin = data.yearBuiltMin
      if (data.yearBuiltMax) filters.yearBuiltMax = data.yearBuiltMax
      if (data.minValueScore) filters.minValueScore = data.minValueScore

      // Build a human-readable summary of what was applied
      const parts = []
      if (data.category && data.category !== 'any') parts.push(data.category)
      if (data.rooms) parts.push(`${data.rooms}+ beds`)
      if (data.bathrooms) parts.push(`${data.bathrooms}+ baths`)
      if (data.maxPrice) parts.push(`≤$${(data.maxPrice / 1000).toFixed(0)}k`)
      if (data.minPrice) parts.push(`≥$${(data.minPrice / 1000).toFixed(0)}k`)
      if (data.city) parts.push(data.city)
      if (data.state) parts.push(data.state)
      if (data.county) parts.push(`${data.county} County`)
      if (data.minArea) parts.push(`≥${data.minArea} sqft`)
      if (data.maxArea) parts.push(`≤${data.maxArea} sqft`)
      if (data.yearBuiltMin) parts.push(`built ≥${data.yearBuiltMin}`)
      if (data.yearBuiltMax) parts.push(`built ≤${data.yearBuiltMax}`)
      if (data.homeStatus) parts.push(data.homeStatus.replace(/_/g, ' ').toLowerCase())
      if (data.minValueScore) parts.push(`score ≥${data.minValueScore}`)
      if (data.sort) parts.push(`sorted by ${data.sort.replace(/_/g, ' ')}`)
      if (data.q) parts.push(`"${data.q}"`)

      setAppliedSummary(parts.length > 0 ? parts.join(' · ') : 'Applied filters')
      onApply(filters, query)
      setQuery('')
    } catch (err) {
      console.error(err)
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg">✨</div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setErrorMsg(null)
            setAppliedSummary(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleAIParse()}
          placeholder='Try "3 bed house in TX built after 2010" or "best value condo in Miami"'
          disabled={loading}
          className="h-12 w-full rounded-2xl border border-rose-200 bg-rose-50/50 pl-10 pr-28 text-sm shadow-sm transition focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1.5">
          {query.length > 3 && (
            <button
              type="button"
              onClick={handleAIParse}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-600 focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-1 disabled:opacity-75 disabled:cursor-wait transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <svg className="h-3 w-3 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
                  </svg>
                  Parsing
                </>
              ) : (
                'Smart Search'
              )}
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
          ⚠️ {errorMsg}
        </div>
      )}

      {appliedSummary && !errorMsg && (
        <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 flex items-center gap-1.5">
          <span>✓</span>
          <span className="font-medium">Filters applied:</span>
          <span className="opacity-80">{appliedSummary}</span>
        </div>
      )}
    </div>
  )
}
