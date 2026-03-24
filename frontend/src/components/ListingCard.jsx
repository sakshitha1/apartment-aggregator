import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { formatPrice } from '../data/mockListings.js'
import { useFavorites } from '../context/FavoritesContext.jsx'
import { useCompare } from '../context/CompareContext.jsx'
import { ValueScoreBadge } from './ValueScoreBadge.jsx'
import { MarketLabel } from './MarketLabel.jsx'
import { usePreferenceMatch, PreferenceMatchBadge } from './PreferenceMatcher.jsx'
import { usePreferences } from '../context/PreferencesContext.jsx'

function Badge({ children, tone = 'dark' }) {
  const tones = {
    dark: 'bg-zinc-900 text-white',
    light: 'bg-white/90 text-zinc-900',
    rose: 'bg-rose-500 text-white',
  }
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold shadow-sm',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

export function ListingCard({ listing, nlKeywords }) {
  const { isFavorite, toggle: toggleFav } = useFavorites()
  const { isInCompare, toggle: toggleCompare, count, max } = useCompare()
  const { prefs } = usePreferences()
  const saved = isFavorite(listing.id)
  const inCompare = isInCompare(listing.id)
  const canAddCompare = inCompare || count < max

  const match = usePreferenceMatch(listing, nlKeywords || prefs.keywords)

  const topBadges = useMemo(() => {
    const out = []
    if (listing.isNew) out.push({ label: 'New', tone: 'rose' })
    for (const b of listing.badges || []) {
      out.push({ label: b, tone: 'dark' })
    }
    return out.slice(0, 2)
  }, [listing])

  const pricePerSqft =
    listing.price && listing.livingArea
      ? Math.round(listing.price / listing.livingArea)
      : null

  return (
    <motion.article
      className="group"
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
    >
      <div className="block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
        <Link to={`/listing/${listing.id}`}>
          <div className="relative aspect-video overflow-hidden bg-zinc-100">
            {listing.photos?.length ? (
              <img
                src={listing.photos[0]}
                alt={listing.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-900 border-b-4 border-rose-500">
                <div className="text-center font-serif">
                  <div className="text-xl font-light tracking-widest text-white opacity-90 px-2 line-clamp-1">{listing.city?.toUpperCase() || 'PROPERTY'}</div>
                  <div className="mt-1 text-[9px] font-semibold tracking-[0.15em] text-rose-400 uppercase">{listing.homeType || 'Listing'}</div>
                </div>
              </div>
            )}

            <div className="absolute left-3 top-3 flex gap-2">
              {topBadges.map((b) => (
                <Badge key={b.label} tone={b.tone}>
                  {b.label}
                </Badge>
              ))}
            </div>

            {listing.valueScore != null && (
              <div className="absolute bottom-3 left-3">
                <ValueScoreBadge score={listing.valueScore} />
              </div>
            )}

            <button
              type="button"
              aria-label={saved ? 'Remove from favorites' : 'Save to favorites'}
              onClick={(e) => {
                e.preventDefault()
                toggleFav(listing.id)
              }}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm hover:bg-white"
            >
              <svg
                viewBox="0 0 24 24"
                className={clsx('h-5 w-5', saved ? 'text-rose-500' : 'text-zinc-700')}
                fill={saved ? 'currentColor' : 'none'}
              >
                <path
                  d="M12 21s-7-4.6-9.5-8.6C.5 8.9 3 6 6.3 6c1.7 0 3.2.8 3.7 1.7.5-.9 2-1.7 3.7-1.7C17 6 19.5 8.9 21.5 12.4 19 16.4 12 21 12 21z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </Link>

        <div className="space-y-1 p-4">
          <Link to={`/listing/${listing.id}`} className="block">
            <div className="line-clamp-1 text-sm font-semibold text-zinc-900">
              {listing.title}
            </div>
            <div className="line-clamp-1 text-xs text-zinc-500">
              {listing.address}
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-zinc-500">
            {listing.bedrooms ? <span>{listing.bedrooms} bd</span> : null}
            {listing.bathrooms ? <span>· {listing.bathrooms} ba</span> : null}
            {listing.livingArea ? <span>· {listing.livingArea} {listing.livingAreaUnits || 'sqft'}</span> : null}
          </div>

          {/* Market label + preference match */}
          {(listing.marketLabel || match) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {listing.marketLabel && <MarketLabel label={listing.marketLabel} />}
              {match && <PreferenceMatchBadge match={match} />}
            </div>
          )}

          <div className="flex items-baseline justify-between pt-1 text-sm">
            <span className="font-semibold text-zinc-900">
              {formatPrice(listing.price)}
            </span>
            {pricePerSqft ? (
              <span className="text-xs text-zinc-400">${pricePerSqft}/sqft</span>
            ) : null}
          </div>

          {/* Compare button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => toggleCompare(listing.id)}
              disabled={!canAddCompare}
              className={clsx(
                'w-full rounded-lg border py-1.5 text-[11px] font-semibold transition',
                inCompare
                  ? 'border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100'
                  : canAddCompare
                  ? 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                  : 'border-zinc-100 bg-white text-zinc-300 cursor-not-allowed',
              )}
            >
              {inCompare ? '✓ In Compare' : canAddCompare ? '+ Compare' : 'Compare full'}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

function getCategoryIcon(category) {
  const icons = {
    apartment: '🏢',
    condo: '🏬',
    'single-family': '🏡',
    'multi-family': '🏘️',
    townhouse: '🏠',
    manufactured: '🏭',
    lot: '🌳',
  }
  return icons[category] || '🏠'
}
