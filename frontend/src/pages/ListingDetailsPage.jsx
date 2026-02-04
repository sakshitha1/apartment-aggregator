import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button.jsx'
import { ImageCarousel } from '../components/ImageCarousel.jsx'
import { StaticMap } from '../components/StaticMap.jsx'
import { PageFade } from '../components/PageFade.jsx'
import { formatPriceKZT, MOCK_LISTINGS } from '../data/mockListings.js'

function Amenity({ label }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-100 text-base">
        ✓
      </span>
      <span className="font-medium">{label}</span>
    </li>
  )
}

export function ListingDetailsPage() {
  const { id } = useParams()
  const baseId = (id || '').split('-')[0]

  const listing = useMemo(
    () => MOCK_LISTINGS.find((l) => l.id === baseId),
    [baseId],
  )

  const [dates, setDates] = useState({ start: '', end: '' })

  if (!listing) {
    return (
      <PageFade>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6">
          <div className="text-lg font-semibold">Listing not found</div>
          <div className="mt-2 text-sm text-zinc-600">
            Try going back to{' '}
            <Link className="font-semibold text-rose-600" to="/search">
              search
            </Link>
            .
          </div>
        </div>
      </PageFade>
    )
  }

  return (
    <PageFade>
      <div className="space-y-6">
      {/* Mobile: carousel */}
      <div className="sm:hidden">
        <ImageCarousel images={listing.photos} />
      </div>

      {/* Desktop: 5-photo mosaic */}
      <div className="hidden overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 shadow-sm sm:block">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 p-2">
          <img
            src={listing.photos[0]}
            alt=""
            className="col-span-2 row-span-2 h-full w-full rounded-2xl object-cover"
          />
          {listing.photos.slice(1, 5).map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className="h-full w-full rounded-2xl object-cover"
              loading={i < 1 ? 'eager' : 'lazy'}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-6">
          <section className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
            <div className="text-sm text-zinc-600">{listing.address}</div>

            <div className="mt-4 flex items-center gap-3">
              <img
                src={listing.host.avatarUrl}
                alt={listing.host.name}
                className="h-11 w-11 rounded-full object-cover"
                loading="lazy"
              />
              <div>
                <div className="text-sm font-semibold">Hosted by {listing.host.name}</div>
                <div className="text-xs text-zinc-500">Top-rated host</div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">Amenities</h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {listing.amenities.map((a) => (
                <Amenity key={a} label={a} />
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">Map</h2>
            <StaticMap lat={listing.location.lat} lng={listing.location.lng} />
          </section>
        </div>

        {/* Sticky action box */}
        <aside className="lg:sticky lg:top-20">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xl font-semibold text-zinc-900">
                  {formatPriceKZT(listing.price)}
                </div>
                <div className="text-xs text-zinc-500">per {listing.priceUnit}</div>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                {listing.rooms} rooms
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <label className="block">
                <div className="mb-1 text-xs font-medium text-zinc-600">
                  Start date
                </div>
                <input
                  type="date"
                  value={dates.start}
                  onChange={(e) => setDates((d) => ({ ...d, start: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-xs font-medium text-zinc-600">
                  End date
                </div>
                <input
                  type="date"
                  value={dates.end}
                  onChange={(e) => setDates((d) => ({ ...d, end: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </label>
            </div>

            <Button
              size="lg"
              className="mt-4 w-full"
              onClick={() => {
                // Placeholder for backend integration
                alert('Contact request sent (demo).')
              }}
            >
              Contact host
            </Button>

            <div className="mt-3 text-center text-xs text-zinc-500">
              You won’t be charged yet.
            </div>
          </div>
        </aside>
      </div>
      </div>
    </PageFade>
  )
}

