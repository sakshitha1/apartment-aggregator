import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button.jsx'
import { ListingCard } from '../components/ListingCard.jsx'
import { ListingCardSkeleton } from '../components/Skeletons.jsx'
import { PageFade } from '../components/PageFade.jsx'
import { CATEGORIES, formatPrice } from '../data/mockListings.js'
import { fetchListings, fetchStats } from '../api/listings.js'

const CATEGORY_ICONS = {
  apartment: '🏢',
  condo: '🏬',
  'single-family': '🏡',
  'multi-family': '🏘️',
  townhouse: '🏠',
  manufactured: '🏭',
  lot: '🌳',
}

function HeroField({ label, children }) {
  return (
    <div className="flex-1">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
        {label}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function StatCard({ value, label }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm">
      <div className="text-xl font-bold text-zinc-900">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const [featured, setFeatured] = useState([])
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [stats, setStats] = useState(null)
  const [heroQuery, setHeroQuery] = useState('')
  const [heroCategory, setHeroCategory] = useState('')
  const [heroPrice, setHeroPrice] = useState('')

  useEffect(() => {
    fetchListings({ sort: 'recommended', limit: 4 })
      .then((items) => setFeatured(items.slice(0, 4)))
      .catch(() => setFeatured([]))
      .finally(() => setLoadingFeatured(false))

    fetchStats()
      .then((data) => setStats(data))
      .catch(() => {})
  }, [])

  return (
    <PageFade>
      <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-900 text-white">
        <div className="absolute inset-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=2200&q=70"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative px-5 py-12 sm:px-10 sm:py-16">
          <div className="max-w-xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">
              Buy or sell your dream home.
            </h1>
            <p className="mt-3 text-sm text-white/80 sm:text-base">
              A peer-to-peer marketplace for buying and selling properties directly.
            </p>
          </div>

          <form
            className="mt-7 rounded-3xl bg-white p-3 text-zinc-900 shadow-xl"
            onSubmit={(e) => {
              e.preventDefault()
              const params = new URLSearchParams()
              if (heroQuery.trim()) params.set('q', heroQuery.trim())
              if (heroCategory) params.set('category', heroCategory)
              if (heroPrice) params.set('maxPrice', heroPrice)
              navigate(`/search?${params.toString()}`)
            }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <HeroField label="Location">
                <input
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="City, neighborhood…"
                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </HeroField>

              <HeroField label="Property Type">
                <select
                  value={heroCategory}
                  onChange={(e) => setHeroCategory(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="">All types</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </HeroField>

              <HeroField label="Price Range">
                <select
                  value={heroPrice}
                  onChange={(e) => setHeroPrice(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="">Any price</option>
                  <option value="200000">Under $200K</option>
                  <option value="500000">Under $500K</option>
                  <option value="1000000">Under $1M</option>
                  <option value="5000000">Under $5M</option>
                </select>
              </HeroField>

              <Button size="lg" className="w-full md:w-auto">
                Search
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Categories</h2>
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="text-sm font-semibold text-rose-600 hover:text-rose-700"
          >
            View all
          </button>
        </div>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => navigate(`/search?category=${c.key}`)}
              className="flex shrink-0 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium shadow-sm hover:bg-zinc-50"
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-zinc-100">
                <span className="text-base">{CATEGORY_ICONS[c.key] || '🏠'}</span>
              </span>
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {stats && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Market Overview</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              value={stats.totalListings?.toLocaleString() || '—'}
              label="Total Listings"
            />
            <StatCard
              value={stats.avgPrice ? formatPrice(stats.avgPrice) : '—'}
              label="Avg. Price"
            />
            <StatCard
              value={stats.cities?.toLocaleString() || '—'}
              label="Cities"
            />
            <StatCard
              value={stats.states?.toLocaleString() || '—'}
              label="States"
            />
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Featured properties</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loadingFeatured
            ? Array.from({ length: 4 }).map((_, i) => <ListingCardSkeleton key={i} />)
            : featured.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      </section>
      </div>
    </PageFade>
  )
}

