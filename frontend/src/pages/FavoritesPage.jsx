import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageFade } from '../components/PageFade.jsx'
import { ListingCard } from '../components/ListingCard.jsx'
import { ListingCardSkeleton } from '../components/Skeletons.jsx'
import { useFavorites } from '../context/FavoritesContext.jsx'
import { fetchListingById } from '../api/listings.js'

export function FavoritesPage() {
  const { ids } = useFavorites()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ids.length === 0) {
      setListings([])
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all(ids.map((id) => fetchListingById(id).catch(() => null)))
      .then((results) => setListings(results.filter(Boolean)))
      .finally(() => setLoading(false))
  }, [ids])

  return (
    <PageFade>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Saved Properties</h1>
          <div className="text-sm text-zinc-600">
            {loading
              ? 'Loading…'
              : ids.length === 0
                ? "You haven't saved any properties yet."
                : `${listings.length} saved ${listings.length === 1 ? 'property' : 'properties'}`}
          </div>
        </div>

        {!loading && ids.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center">
            <span className="text-4xl">❤️</span>
            <div className="mt-3 text-sm font-semibold text-zinc-900">No saved properties</div>
            <div className="mt-1 text-sm text-zinc-500">
              Click the heart icon on any listing to save it here.
            </div>
            <Link
              to="/search"
              className="mt-4 inline-block rounded-full bg-rose-500 px-6 py-2 text-sm font-semibold text-white hover:bg-rose-600"
            >
              Browse properties
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: Math.min(ids.length, 6) }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))
              : listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </PageFade>
  )
}
