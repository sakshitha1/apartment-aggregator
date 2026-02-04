import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button.jsx'
import { ListingCard } from '../components/ListingCard.jsx'
import { PageFade } from '../components/PageFade.jsx'
import { CATEGORIES, MOCK_LISTINGS } from '../data/mockListings.js'

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

export function HomePage() {
  const navigate = useNavigate()
  const featured = useMemo(() => MOCK_LISTINGS.slice(0, 4), [])
  const [location, setLocation] = useState('')
  const [guests, setGuests] = useState(2)

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
              Find your next place — fast.
            </h1>
            <p className="mt-3 text-sm text-white/80 sm:text-base">
              Minimal, mobile-first search with image-first listings inspired by Airbnb.
            </p>
          </div>

          <form
            className="mt-7 rounded-3xl bg-white p-3 text-zinc-900 shadow-xl"
            onSubmit={(e) => {
              e.preventDefault()
              const params = new URLSearchParams()
              if (location.trim()) params.set('location', location.trim())
              params.set('guests', String(guests))
              navigate(`/search?${params.toString()}`)
            }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <HeroField label="Location">
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, neighborhood…"
                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </HeroField>

              <HeroField label="Dates">
                <button
                  type="button"
                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-left text-sm text-zinc-500 hover:bg-zinc-50"
                >
                  Add dates
                </button>
              </HeroField>

              <HeroField label="Guests">
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
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
                <span className="text-base">🏠</span>
              </span>
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Featured listings</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {featured.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </section>
      </div>
    </PageFade>
  )
}

