const SKELETON_COUNT = 10

export default function AnimeGridSkeleton({ count = SKELETON_COUNT }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mt-8"
      role="status"
      aria-label="Загрузка аниме"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse" aria-hidden="true">
          <div className="aspect-[3/4] bg-white/5 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer" />
          </div>
          <div className="p-3 space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
            </div>
            <div className="h-3 bg-white/10 rounded w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
            </div>
            <div className="flex gap-1 mt-2">
              <div className="h-3 bg-white/10 rounded-full w-10" />
              <div className="h-3 bg-white/10 rounded-full w-8" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Загрузка...</span>
    </div>
  )
}