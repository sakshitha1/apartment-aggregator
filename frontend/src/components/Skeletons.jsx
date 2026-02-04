function Shimmer({ className }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-zinc-100 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
    </div>
  )
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <Shimmer className="aspect-video rounded-none" />
      <div className="space-y-2 p-4">
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-2/3" />
        <Shimmer className="h-4 w-1/2" />
      </div>
    </div>
  )
}

export function FilterSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <Shimmer className="h-4 w-32" />
      <Shimmer className="h-10 w-full" />
      <Shimmer className="h-10 w-full" />
      <Shimmer className="h-10 w-full" />
    </div>
  )
}

