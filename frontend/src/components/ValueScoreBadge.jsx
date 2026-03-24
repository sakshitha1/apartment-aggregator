import clsx from 'clsx'

function getScoreTier(score) {
  if (score >= 85) return { label: 'Excellent', color: 'bg-violet-600 text-white', ring: 'ring-violet-300' }
  if (score >= 70) return { label: 'Great', color: 'bg-emerald-600 text-white', ring: 'ring-emerald-300' }
  if (score >= 55) return { label: 'Good', color: 'bg-blue-600 text-white', ring: 'ring-blue-300' }
  if (score >= 40) return { label: 'Fair', color: 'bg-amber-500 text-white', ring: 'ring-amber-300' }
  return { label: 'Low', color: 'bg-zinc-500 text-white', ring: 'ring-zinc-300' }
}

export function ValueScoreBadge({ score, size = 'sm', showLabel = false }) {
  if (score == null) return null
  const tier = getScoreTier(score)

  if (size === 'lg') {
    return (
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'flex h-16 w-16 flex-col items-center justify-center rounded-2xl ring-4',
            tier.color,
            tier.ring,
          )}
        >
          <span className="text-xl font-bold leading-none">{score}</span>
          <span className="text-[10px] font-semibold opacity-80">/ 100</span>
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Value Score</div>
          <div className="text-base font-bold text-zinc-900">{tier.label}</div>
          <ScoreBar score={score} tier={tier} />
        </div>
      </div>
    )
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold shadow-sm',
        tier.color,
      )}
      title={`Value Score: ${score}/100 — ${tier.label}`}
    >
      ★ {score}
      {showLabel && <span className="opacity-80">· {tier.label}</span>}
    </span>
  )
}

function ScoreBar({ score, tier }) {
  return (
    <div className="mt-1.5 h-1.5 w-32 rounded-full bg-zinc-200 overflow-hidden">
      <div
        className={clsx('h-full rounded-full transition-all', tier.color.replace('text-white', ''))}
        style={{ width: `${score}%` }}
      />
    </div>
  )
}

export function ValueScoreExplainer() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 space-y-1">
      <div className="font-semibold text-zinc-800">How Value Score is calculated</div>
      <ul className="space-y-0.5 list-disc list-inside">
        <li>40% — Price vs city median (below = better)</li>
        <li>20% — Living area (larger = better)</li>
        <li>20% — Listing freshness (newer = more opportunity)</li>
        <li>20% — Page view popularity</li>
      </ul>
    </div>
  )
}
