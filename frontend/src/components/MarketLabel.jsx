import clsx from 'clsx'

const CONFIGS = {
  'Great Deal': {
    icon: '🏷️',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  'Below Market': {
    icon: '📉',
    color: 'bg-green-50 text-green-800 border-green-200',
    dot: 'bg-green-400',
  },
  'Market Price': {
    icon: '⚖️',
    color: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-400',
  },
  'Above Market': {
    icon: '📈',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-400',
  },
  Premium: {
    icon: '💎',
    color: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-500',
  },
}

export function MarketLabel({ label, size = 'sm' }) {
  if (!label) return null
  const cfg = CONFIGS[label] || CONFIGS['Market Price']

  if (size === 'lg') {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold',
          cfg.color,
        )}
      >
        <span className={clsx('h-2 w-2 rounded-full', cfg.dot)} />
        {label}
      </span>
    )
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
        cfg.color,
      )}
    >
      {cfg.icon} {label}
    </span>
  )
}

export function CityPriceWidget({ cityStats, currentPrice, knnPrice }) {
  if (!cityStats) return null

  const { p25, median, p75, p90, count, avg } = cityStats

  const scale = p90 > 0 ? p90 : 1

  const pct = currentPrice > 0 && p90 > 0
    ? Math.min(100, Math.max(0, (currentPrice / scale) * 100))
    : null

  const knnPct = knnPrice > 0 && p90 > 0
    ? Math.min(100, Math.max(0, (knnPrice / scale) * 100))
    : null

  function fmt(v) {
    if (!v) return '—'
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    return `$${(v / 1_000).toFixed(0)}K`
  }

  const statCols = [
    { l: 'p25', v: p25 },
    { l: 'Median', v: median },
    { l: 'p75', v: p75 },
    { l: 'p90', v: p90 },
  ]
  if (knnPrice) statCols.splice(2, 0, { l: 'KNN Est.', v: knnPrice, highlight: true })

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-semibold text-zinc-800">City Price Range</div>
        <div className="text-xs text-zinc-400">{count} listings</div>
      </div>

      <div className={`grid gap-2 text-center ${statCols.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {statCols.map(({ l, v, highlight }) => (
          <div key={l} className={highlight ? 'rounded-lg bg-violet-50 px-1 py-0.5' : ''}>
            <div className={`text-xs font-bold ${highlight ? 'text-violet-700' : 'text-zinc-900'}`}>{fmt(v)}</div>
            <div className={`text-[10px] ${highlight ? 'text-violet-400 font-semibold' : 'text-zinc-400'}`}>{l}</div>
          </div>
        ))}
      </div>

      {/* Bar */}
      <div className="relative h-3 rounded-full bg-gradient-to-r from-emerald-200 via-blue-200 to-rose-200 overflow-visible">
        {knnPct !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-5 w-1.5 rounded-full bg-violet-500 shadow"
            style={{ left: `${Math.min(97, knnPct)}%` }}
            title={`KNN estimate: ${fmt(knnPrice)}`}
          />
        )}
        {pct !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-zinc-900 shadow"
            style={{ left: `${Math.min(98, pct)}%` }}
            title={`This listing: ${fmt(currentPrice)}`}
          />
        )}
      </div>

      <div className="flex justify-between text-[10px] text-zinc-400">
        <span>p25 {fmt(p25)}</span>
        <span>Median {fmt(median)}</span>
        <span>p90 {fmt(p90)}</span>
      </div>

      {currentPrice > 0 && (
        <div className="text-xs text-zinc-600 space-y-0.5">
          <div>
            Avg in city: <span className="font-semibold text-zinc-900">{fmt(avg)}</span>
            {' · '}
            This listing:{' '}
            <span className={currentPrice < median ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>
              {fmt(currentPrice)}
            </span>
            {currentPrice < median
              ? ` (${Math.round(((median - currentPrice) / median) * 100)}% below median)`
              : ` (${Math.round(((currentPrice - median) / median) * 100)}% above median)`}
          </div>
          {knnPrice > 0 && (
            <div>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
                KNN model estimate:{' '}
                <span className="font-semibold text-violet-700">{fmt(knnPrice)}</span>
                {currentPrice > 0 && (
                  <span className="text-zinc-400">
                    {' '}
                    ({currentPrice > knnPrice
                      ? `${Math.round(((currentPrice - knnPrice) / knnPrice) * 100)}% above estimate`
                      : `${Math.round(((knnPrice - currentPrice) / knnPrice) * 100)}% below estimate`})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
