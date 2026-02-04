export function StaticMap({ lat, lng }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="aspect-[16/10] bg-zinc-100">
        <img
          src="https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&w=1600&q=60"
          alt="Map preview"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <div className="text-sm font-semibold">Approximate location</div>
        <div className="mt-1 text-xs text-zinc-600">
          Lat {lat.toFixed(5)} · Lng {lng.toFixed(5)}
        </div>
      </div>
    </div>
  )
}

