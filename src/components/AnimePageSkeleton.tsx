export default function AnimePageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Постер */}
        <div className="w-full md:w-1/3 lg:w-1/4 space-y-3">
          <div className="aspect-[3/4] bg-white/5 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer" />
          </div>
          <div className="space-y-2">
            <div className="h-10 bg-white/10 rounded-xl w-full relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
            </div>
            <div className="h-10 bg-white/10 rounded-xl w-full relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
            </div>
          </div>
        </div>
        
        {/* Информация */}
        <div className="flex-1 space-y-4">
          <div className="h-10 bg-white/10 rounded-xl w-2/3 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer" />
          </div>
          <div className="h-6 bg-white/10 rounded-xl w-1/3 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 bg-white/10 rounded-full w-16 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
            </div>
            <div className="h-6 bg-white/10 rounded-full w-12 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded w-full relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
            </div>
            <div className="h-4 bg-white/10 rounded w-5/6 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
            </div>
            <div className="h-4 bg-white/10 rounded w-4/6 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-6 bg-white/10 rounded w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
            </div>
            <div className="h-6 bg-white/10 rounded w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Плеер и эпизоды */}
      <div className="mt-10 space-y-4">
        <div className="aspect-video bg-white/5 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer" />
        </div>
        <div className="flex gap-3">
          <div className="h-12 bg-white/10 rounded-xl w-20 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer" />
          </div>
          <div className="h-12 bg-white/10 rounded-xl w-20 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  )
}