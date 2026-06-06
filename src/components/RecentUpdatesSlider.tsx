'use client'
import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface RecentItem {
  id?: string
  anime_id?: string
  title_ru?: string
  poster_url?: string
  genres?: any[]
  episode_number?: number // если захотим показывать номер серии
}

export default function RecentUpdatesSlider({ items }: { items: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 300
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (!items || items.length === 0) return null

  return (
    <div className="relative group">
      {/* Кнопки прокрутки - всегда видимы */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 hover:scale-105 transition-all duration-200"
        aria-label="Прокрутить влево"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 hover:scale-105 transition-all duration-200"
        aria-label="Прокрутить вправо"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Контейнер с карточками */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        {items.map((item, idx) => {
          const animeData = item.anime || item
          const href = item.anime_id ? `/anime/${item.anime_id}` : `/anime/${animeData.id}`
          return (
            <Link
              key={item.id || idx}
              href={href}
              className="flex-shrink-0 w-40 sm:w-48 group glass rounded-2xl overflow-hidden card-glow transition-all duration-300 hover:scale-[1.02] hover:shadow-neon"
            >
              <div className="aspect-[3/4] relative overflow-hidden">
                <Image
                  src={animeData.poster_url || '/placeholder.jpg'}
                  alt={animeData.title_ru}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="160px"
                />
                {/* Если есть номер эпизода, покажем метку */}
                {item.episode_number && (
                  <div className="absolute top-2 left-2 bg-neo-purple/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
                    Эп. {item.episode_number}
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-white truncate" title={animeData.title_ru}>
                  {animeData.title_ru}
                </h3>
                {animeData.genres && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {animeData.genres.slice(0, 2).map((g: any) => (
                      <span 
                        key={g.slug} 
                        className="text-xs bg-neo-purple/15 text-neo-purple-light px-2 py-0.5 rounded-full font-medium"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}