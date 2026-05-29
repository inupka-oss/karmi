export default function AnimePageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 lg:w-1/4">
          <div className="aspect-[3/4] bg-white/5 rounded-2xl"></div>
          <div className="mt-4 space-y-2">
            <div className="h-8 bg-white/10 rounded-xl w-full"></div>
            <div className="h-8 bg-white/10 rounded-xl w-full"></div>
            <div className="h-8 bg-white/10 rounded-xl w-full"></div>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-10 bg-white/10 rounded-xl w-2/3"></div>
          <div className="h-6 bg-white/10 rounded-xl w-1/3"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-white/10 rounded-full w-16"></div>
            <div className="h-6 bg-white/10 rounded-full w-12"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded w-full"></div>
            <div className="h-4 bg-white/10 rounded w-5/6"></div>
            <div className="h-4 bg-white/10 rounded w-4/6"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-6 bg-white/10 rounded w-1/2"></div>
            <div className="h-6 bg-white/10 rounded w-1/2"></div>
            <div className="h-6 bg-white/10 rounded w-1/2"></div>
            <div className="h-6 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
      </div>
      <div className="mt-10">
        <div className="aspect-video bg-white/5 rounded-xl mb-4"></div>
        <div className="flex gap-3">
          <div className="h-12 bg-white/10 rounded-xl w-20"></div>
          <div className="h-12 bg-white/10 rounded-xl w-20"></div>
        </div>
      </div>
    </div>
  )
}