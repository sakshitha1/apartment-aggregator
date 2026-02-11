import clsx from 'clsx'
import { CATEGORIES } from '../data/mockListings.js'

function SectionTitle({ children }) {
  return <div className="text-xs font-semibold tracking-wide text-zinc-700">{children}</div>
}

export function FilterBar({ filters, onChange, className }) {
  const update = (patch) => onChange({ ...filters, ...patch })

  return (
    <aside
      className={clsx(
        'space-y-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm',
        className,
      )}
    >
      <div className="space-y-2">
        <SectionTitle>Type</SectionTitle>
        <select
          value={filters.category}
          onChange={(e) => update({ category: e.target.value })}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
        >
          <option value="any">Any</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <SectionTitle>Price range (max)</SectionTitle>
        <input
          type="range"
          min={50000}
          max={5000000}
          step={50000}
          value={filters.maxPrice}
          onChange={(e) => update({ maxPrice: Number(e.target.value) })}
          className="w-full accent-rose-500"
        />
        <div className="flex items-center justify-between text-xs text-zinc-600">
          <span>$50K</span>
          <span className="font-semibold text-zinc-900">
            ${filters.maxPrice >= 1000000
              ? `${(filters.maxPrice / 1000000).toFixed(1)}M`
              : `${(filters.maxPrice / 1000).toFixed(0)}K`}
          </span>
          <span>$5M</span>
        </div>
      </div>

      <div className="space-y-2">
        <SectionTitle>Bedrooms</SectionTitle>
        <select
          value={filters.rooms}
          onChange={(e) => update({ rooms: e.target.value })}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
        >
          <option value="any">Any</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
      </div>

    </aside>
  )
}

