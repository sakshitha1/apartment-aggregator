import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { formatPriceKZT } from '../data/mockListings.js'

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

export function ListingCard({ listing }) {
  const [saved, setSaved] = useState(false)

  const topBadges = useMemo(() => {
    const out = []
    if (listing.isNew) out.push({ label: 'New', tone: 'rose' })
    for (const b of listing.badges || []) {
      out.push({ label: b, tone: 'dark' })
    }
    return out.slice(0, 2)
  }, [listing])

  return (
    <motion.article
      className="group"
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
    >
      <Link
        to={`/listing/${listing.id}`}
        className="block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
      >
        <div className="relative aspect-video overflow-hidden bg-zinc-100">
          <img
            src={listing.photos?.[0]}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />

          <div className="absolute left-3 top-3 flex gap-2">
            {topBadges.map((b) => (
              <Badge key={b.label} tone={b.tone}>
                {b.label}
              </Badge>
            ))}
          </div>

          <button
            type="button"
            aria-label={saved ? 'Remove from favorites' : 'Save to favorites'}
            onClick={(e) => {
              e.preventDefault()
              setSaved((v) => !v)
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

        <div className="space-y-1 p-4">
          <div className="line-clamp-1 text-sm font-semibold text-zinc-900">
            {listing.title}
          </div>
          <div className="line-clamp-1 text-xs text-zinc-500">
            {listing.address}
          </div>

          <div className="pt-1 text-sm">
            <span className="font-semibold text-zinc-900">
              {formatPriceKZT(listing.price)}
            </span>{' '}
            <span className="text-zinc-500">/ {listing.priceUnit}</span>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

