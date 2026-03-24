import { useMemo } from 'react'

const KEYWORD_RULES = [
  // Size / space
  { words: ['spacious', 'large', 'big', 'roomy', 'huge', 'generous'], test: (l) => (l.livingArea || 0) >= 1500 },
  { words: ['small', 'cozy', 'compact', 'studio', 'tiny', 'intimate'], test: (l) => (l.livingArea || 0) < 900 && (l.livingArea || 0) > 0 },
  { words: ['mid-size', 'medium', 'average size'], test: (l) => (l.livingArea || 0) >= 900 && (l.livingArea || 0) < 1500 },

  // Age / condition
  { words: ['modern', 'new construction', 'newly built', 'contemporary', 'new build'], test: (l) => (l.yearBuilt || 0) >= 2010 },
  { words: ['renovated', 'updated', 'remodeled', 'move-in ready'], test: (l) => (l.yearBuilt || 0) >= 2000 },
  { words: ['historic', 'classic', 'vintage', 'character', 'old', 'charming'], test: (l) => (l.yearBuilt || 0) < 1970 && (l.yearBuilt || 0) > 0 },
  { words: ['post-war', '1950s', '1960s', 'mid-century'], test: (l) => (l.yearBuilt || 0) >= 1945 && (l.yearBuilt || 0) < 1975 },

  // Bedrooms
  { words: ['studio', 'bachelor', '1 bedroom', 'one bedroom', 'one-bedroom'], test: (l) => (l.bedrooms || 0) <= 1 },
  { words: ['2 bedroom', 'two bedroom', 'two-bedroom', 'couple'], test: (l) => (l.bedrooms || 0) === 2 },
  { words: ['family', 'kids', '3 bedroom', '4 bedroom', 'three bedroom', 'four bedroom', 'large family'], test: (l) => (l.bedrooms || 0) >= 3 },
  { words: ['5 bedroom', 'five bedroom', 'mansion', 'estate'], test: (l) => (l.bedrooms || 0) >= 5 },

  // Bathrooms
  { words: ['1 bath', 'one bath', 'single bath'], test: (l) => (l.bathrooms || 0) >= 1 },
  { words: ['2 bath', 'two bath', 'en-suite', 'ensuite'], test: (l) => (l.bathrooms || 0) >= 2 },
  { words: ['3 bath', 'three bath', 'multiple bathrooms'], test: (l) => (l.bathrooms || 0) >= 3 },

  // Price / value
  { words: ['affordable', 'cheap', 'budget', 'inexpensive', 'entry-level'], test: (l) => (l.price || 0) < 300000 && (l.price || 0) > 0 },
  { words: ['mid-range', 'moderate price', 'reasonably priced'], test: (l) => (l.price || 0) >= 300000 && (l.price || 0) < 600000 },
  { words: ['luxury', 'premium', 'upscale', 'high-end', 'exclusive'], test: (l) => (l.price || 0) >= 800000 },
  { words: ['ultra luxury', 'ultra-luxury', 'mansion price'], test: (l) => (l.price || 0) >= 2000000 },

  // Market position / deal quality
  { words: ['deal', 'bargain', 'below market', 'undervalued', 'steal'], test: (l) => l.marketLabel === 'Great Deal' || l.marketLabel === 'Below Market' },
  { words: ['great deal', 'best deal', 'top deal'], test: (l) => l.marketLabel === 'Great Deal' },
  { words: ['fair price', 'market price', 'market rate'], test: (l) => l.marketLabel === 'Market Price' || l.marketLabel === 'Slightly Above' },
  { words: ['high value', 'high score', 'top rated', 'best value'], test: (l) => (l.valueScore || 0) >= 75 },
  { words: ['investment', 'income property', 'rental income', 'roi'], test: (l) => (l.rentZestimate || 0) > 0 && (l.price || 0) > 0 },

  // Popularity / interest
  { words: ['popular', 'trending', 'well-viewed', 'in demand', 'hot listing'], test: (l) => (l.pageViewCount || 0) >= 100 },
  { words: ['very popular', 'highly viewed', 'most viewed'], test: (l) => (l.pageViewCount || 0) >= 500 },
  { words: ['favorited', 'wishlisted', 'saved a lot'], test: (l) => (l.favoriteCount || 0) >= 20 },

  // Property type
  { words: ['condo', 'condominium'], test: (l) => l.homeType === 'Condominium' || (l.homeType || '').toLowerCase().includes('condo') },
  { words: ['house', 'home', 'single family', 'detached'], test: (l) => (l.homeType || '').toLowerCase().includes('single') || (l.homeType || '').toLowerCase().includes('house') },
  { words: ['apartment', 'flat', 'unit'], test: (l) => (l.homeType || '').toLowerCase().includes('apartment') || (l.homeType || '').toLowerCase().includes('multi') },
  { words: ['townhouse', 'townhome', 'row house'], test: (l) => (l.homeType || '').toLowerCase().includes('town') },
  { words: ['new home', 'brand new', 'newly built home'], test: (l) => l.isNewHome === true },
  { words: ['foreclosure', 'bank owned', 'distressed'], test: (l) => l.isForeclosure === true },

  // Special statuses / urgency
  { words: ['for sale', 'available', 'on market', 'active listing'], test: (l) => (l.homeStatus || '').toUpperCase().includes('FOR_SALE') || (l.homeStatus || '').toUpperCase().includes('FOR SALE') },
  { words: ['recently sold', 'just sold', 'sold recently'], test: (l) => (l.homeStatus || '').toUpperCase().includes('SOLD') },
  { words: ['pending', 'under contract', 'in escrow'], test: (l) => l.isPending === true || (l.homeStatus || '').toLowerCase().includes('pending') },
  { words: ['open house', 'open for viewing', 'showing'], test: (l) => l.hasOpenHouse === true },

  // Neutral / unverifiable keywords (count as partial match)
  { words: ['quiet', 'calm', 'peaceful', 'serene', 'safe'], test: () => null },
  { words: ['bright', 'sunny', 'light-filled', 'light', 'airy'], test: () => null },
  { words: ['park', 'green', 'nature', 'outdoor', 'garden', 'yard'], test: () => null },
  { words: ['transport', 'transit', 'walkable', 'commute', 'subway', 'metro'], test: () => null },
  { words: ['garage', 'parking', 'carport'], test: () => null },
  { words: ['pool', 'gym', 'amenities', 'clubhouse', 'rooftop'], test: () => null },
  { words: ['waterfront', 'lake view', 'ocean view', 'bay view', 'water view'], test: () => null },
  { words: ['mountain view', 'city view', 'skyline view'], test: () => null },
  { words: ['pet friendly', 'pets allowed', 'dog friendly'], test: () => null },
  { words: ['storage', 'basement', 'attic', 'extra space'], test: () => null },
  { words: ['good schools', 'top schools', 'school district', 'near school'], test: () => null },
  { words: ['gated', 'gated community', 'secure', 'security'], test: () => null },
  { words: ['fixer-upper', 'handyman', 'needs work', 'as-is'], test: () => null },
]

export function computePreferenceMatch(listing, keywords) {
  if (!listing || !keywords || !keywords.trim()) return null

  const lower = keywords.toLowerCase()
  const matched = []
  const notMatched = []
  const unknown = []

  for (const rule of KEYWORD_RULES) {
    const hit = rule.words.find((w) => lower.includes(w))
    if (!hit) continue
    const result = rule.test(listing)
    if (result === null) {
      unknown.push(hit)
    } else if (result) {
      matched.push(hit)
    } else {
      notMatched.push(hit)
    }
  }

  const total = matched.length + notMatched.length + unknown.length
  if (!total) return null

  const score = Math.round(
    ((matched.length + unknown.length * 0.5) / (total || 1)) * 100,
  )

  return { score, matched, notMatched, unknown, total }
}

export function usePreferenceMatch(listing, keywords) {
  return useMemo(() => computePreferenceMatch(listing, keywords), [listing, keywords])
}

export function PreferenceMatchBadge({ match, size = 'sm' }) {
  if (!match) return null

  if (size === 'lg') {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-zinc-800">Preference Match</div>
          <div
            className={`text-lg font-bold ${
              match.score >= 70 ? 'text-emerald-600' : match.score >= 40 ? 'text-amber-600' : 'text-rose-600'
            }`}
          >
            {match.score}%
          </div>
        </div>

        <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              match.score >= 70 ? 'bg-emerald-500' : match.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${match.score}%` }}
          />
        </div>

        {match.matched.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 mb-1">Matches</div>
            <div className="flex flex-wrap gap-1">
              {match.matched.map((w) => (
                <span key={w} className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  ✓ {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {match.notMatched.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 mb-1">Doesn't match</div>
            <div className="flex flex-wrap gap-1">
              {match.notMatched.map((w) => (
                <span key={w} className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                  ✗ {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {match.unknown.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-zinc-500 mb-1">Can't verify</div>
            <div className="flex flex-wrap gap-1">
              {match.unknown.map((w) => (
                <span key={w} className="rounded-full bg-zinc-50 border border-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                  ? {w}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        match.score >= 70
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : match.score >= 40
          ? 'bg-amber-50 text-amber-700 border border-amber-200'
          : 'bg-zinc-50 text-zinc-600 border border-zinc-200'
      }`}
      title={`Preference match: ${match.score}%`}
    >
      {match.score >= 70 ? '💚' : match.score >= 40 ? '🟡' : '🔴'} {match.score}% match
    </span>
  )
}
