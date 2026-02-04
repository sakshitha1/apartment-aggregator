import { useMemo, useRef, useState } from 'react'
import clsx from 'clsx'

export function ImageCarousel({ images = [], className }) {
  const safeImages = useMemo(() => images.filter(Boolean), [images])
  const [idx, setIdx] = useState(0)
  const startX = useRef(null)

  if (!safeImages.length) {
    return (
      <div className={clsx('aspect-video w-full rounded-2xl bg-zinc-100', className)} />
    )
  }

  const clamp = (n) => Math.max(0, Math.min(safeImages.length - 1, n))

  return (
    <div
      className={clsx('relative overflow-hidden rounded-2xl bg-zinc-100', className)}
      onTouchStart={(e) => {
        startX.current = e.touches?.[0]?.clientX ?? null
      }}
      onTouchEnd={(e) => {
        const endX = e.changedTouches?.[0]?.clientX ?? null
        if (startX.current == null || endX == null) return
        const dx = endX - startX.current
        if (Math.abs(dx) < 35) return
        if (dx < 0) setIdx((v) => clamp(v + 1))
        else setIdx((v) => clamp(v - 1))
        startX.current = null
      }}
    >
      <div
        className="flex transition-transform duration-300"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {safeImages.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt={`Photo ${i + 1}`}
            className="aspect-video w-full shrink-0 object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous photo"
        className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-sm hover:bg-white sm:grid"
        onClick={() => setIdx((v) => clamp(v - 1))}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path
            d="M14 6l-6 6 6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next photo"
        className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-sm hover:bg-white sm:grid"
        onClick={() => setIdx((v) => clamp(v + 1))}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path
            d="M10 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
        {safeImages.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to photo ${i + 1}`}
            onClick={() => setIdx(i)}
            className={clsx(
              'h-1.5 w-1.5 rounded-full transition',
              i === idx ? 'bg-white' : 'bg-white/50',
            )}
          />
        ))}
      </div>
    </div>
  )
}

