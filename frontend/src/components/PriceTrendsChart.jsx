import { useEffect, useState } from 'react'
import { formatPrice } from '../data/mockListings.js'

function useCityTrends(city) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!city) { setLoading(false); return }
    setLoading(true)
    fetch(`/api/city-trends?city=${encodeURIComponent(city)}`)
      .then((r) => r.json())
      .then((rows) => {
        const valid = rows.filter((r) => r.year >= '2000' && r.avgPrice > 0)
        setData(valid)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [city])
  return { data, loading }
}

function Sparkline({ points, width = 400, height = 120, currentPrice }) {
  if (!points.length) return null
  const prices = points.map((p) => p.avgPrice)
  const years = points.map((p) => p.year)
  const minP = Math.min(...prices) * 0.95
  const maxP = Math.max(...prices) * 1.05
  const pad = { top: 10, right: 30, bottom: 28, left: 58 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const xScale = (i) => pad.left + (i / (points.length - 1)) * innerW
  const yScale = (v) => pad.top + innerH - ((v - minP) / (maxP - minP)) * innerH

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(p.avgPrice).toFixed(1)}`)
    .join(' ')

  const fillD = `${pathD} L${xScale(points.length - 1).toFixed(1)},${(pad.top + innerH).toFixed(1)} L${pad.left},${(pad.top + innerH).toFixed(1)} Z`

  // Year labels — show every ~4-5 years
  const step = Math.max(1, Math.floor(points.length / 6))
  const labelIndices = points.map((_, i) => i).filter((i) => i % step === 0 || i === points.length - 1)

  // Current price line
  const currentY = currentPrice ? yScale(currentPrice) : null

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.5, 1].map((t) => {
        const y = pad.top + t * innerH
        const price = maxP - t * (maxP - minP)
        return (
          <g key={t}>
            <line x1={pad.left} y1={y} x2={pad.left + innerW} y2={y} stroke="#f4f4f5" strokeWidth="1" />
            <text x={pad.left - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#a1a1aa">
              {price >= 1_000_000 ? `$${(price / 1_000_000).toFixed(1)}M` : `$${Math.round(price / 1000)}K`}
            </text>
          </g>
        )
      })}

      {/* Fill */}
      <path d={fillD} fill="url(#trendGrad)" />

      {/* Line */}
      <path d={pathD} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots at each data point */}
      {points.map((p, i) => (
        <circle key={i} cx={xScale(i)} cy={yScale(p.avgPrice)} r="3" fill="#f43f5e" />
      ))}

      {/* Current listing price horizontal line */}
      {currentY != null && currentY >= pad.top && currentY <= pad.top + innerH && (
        <g>
          <line
            x1={pad.left}
            y1={currentY}
            x2={pad.left + innerW}
            y2={currentY}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text x={pad.left + innerW + 3} y={currentY + 4} fontSize="8" fill="#10b981" fontWeight="600">
            This
          </text>
        </g>
      )}

      {/* Year labels */}
      {labelIndices.map((i) => (
        <text
          key={i}
          x={xScale(i)}
          y={pad.top + innerH + 16}
          textAnchor="middle"
          fontSize="9"
          fill="#a1a1aa"
        >
          {years[i]}
        </text>
      ))}
    </svg>
  )
}

export function CityTrendsChart({ city, currentPrice }) {
  const { data, loading } = useCityTrends(city)

  if (loading) {
    return (
      <div className="animate-pulse h-32 rounded-xl bg-zinc-100" />
    )
  }

  if (!data || data.length < 3) return null

  const first = data[0]
  const last = data[data.length - 1]
  const pctChange = Math.round(((last.avgPrice - first.avgPrice) / first.avgPrice) * 100)
  const trend = pctChange > 0 ? 'up' : 'down'
  const recentChange = data.length >= 2
    ? Math.round(((last.avgPrice - data[data.length - 2].avgPrice) / data[data.length - 2].avgPrice) * 100)
    : null

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Market Trends in {city}</h3>
          <p className="text-xs text-zinc-500">Average sale prices • {first.year}–{last.year}</p>
        </div>
        <div className="text-right">
          <div className={`text-sm font-bold ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend === 'up' ? '↑' : '↓'} {Math.abs(pctChange)}%
          </div>
          <div className="text-[10px] text-zinc-400">since {first.year}</div>
        </div>
      </div>

      <Sparkline points={data} currentPrice={currentPrice} />

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-zinc-50 p-2">
          <div className="text-xs font-semibold text-zinc-700">{formatPrice(first.avgPrice)}</div>
          <div className="text-[10px] text-zinc-400">{first.year} avg</div>
        </div>
        <div className="rounded-lg bg-zinc-50 p-2">
          <div className="text-xs font-semibold text-zinc-700">{formatPrice(last.avgPrice)}</div>
          <div className="text-[10px] text-zinc-400">{last.year} avg</div>
        </div>
        <div className="rounded-lg bg-zinc-50 p-2">
          <div className={`text-xs font-semibold ${recentChange > 0 ? 'text-emerald-600' : recentChange < 0 ? 'text-rose-600' : 'text-zinc-700'}`}>
            {recentChange != null ? `${recentChange > 0 ? '+' : ''}${recentChange}%` : '—'}
          </div>
          <div className="text-[10px] text-zinc-400">YoY change</div>
        </div>
      </div>
    </div>
  )
}

export function ListingPriceHistoryChart({ priceHistory }) {
  if (!priceHistory?.length) return null

  const events = priceHistory
    .filter((h) => h.price > 0 && h.date)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (!events.length) return null

  const pctChange = events.length >= 2
    ? Math.round(((events[events.length - 1].price - events[0].price) / events[0].price) * 100)
    : null

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Price History</h3>
        {pctChange != null && (
          <span className={`text-xs font-semibold ${pctChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {pctChange > 0 ? '+' : ''}{pctChange}% overall
          </span>
        )}
      </div>

      {events.length >= 2 && (
        <div className="mb-2">
          <Sparkline
            points={events.map((e) => ({ year: e.date?.slice(0, 7), avgPrice: e.price }))}
            height={80}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-100">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Date</th>
              <th className="px-3 py-2 font-semibold">Event</th>
              <th className="px-3 py-2 font-semibold text-right">Price</th>
              <th className="px-3 py-2 font-semibold text-right">$/sqft</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {priceHistory.slice(0, 8).map((h, i) => (
              <tr key={i} className="hover:bg-zinc-50/50">
                <td className="px-3 py-2 text-zinc-500">{h.date || '—'}</td>
                <td className="px-3 py-2 font-medium">{h.event || '—'}</td>
                <td className="px-3 py-2 text-right font-semibold">
                  {h.price > 0 ? formatPrice(h.price) : '—'}
                </td>
                <td className="px-3 py-2 text-right text-zinc-500">
                  {h.pricePerSqFt > 0 ? `$${h.pricePerSqFt}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
