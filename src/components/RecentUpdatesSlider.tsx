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
      {/* Кнопки прокрутки */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        aria-label="Прокрутить влево"
      >
        ‹
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        aria-label="Прокрутить вправо"
      >
        ›
      </button>

      {/* Контейнер с карточками */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        {items.map((item, idx) => {
          // item может быть как объектом аниме (если мы передали uniqueRecent), так и эпизодом с anime вложенным
          const animeData = item.anime || item
          const href = item.anime_id ? `/anime/${item.anime_id}` : `/anime/${animeData.id}`
          return (
            <Link
              key={item.id || idx}
              href={href}
              className="flex-shrink-0 w-40 sm:w-48 glass rounded-2xl overflow-hidden card-glow card-hover-glow transition-transform hover:scale-[1.02]"
            >
              <div className="aspect-[3/4] relative">
                <Image
                  src={animeData.poster_url || '/placeholder.jpg'}
                  alt={animeData.title_ru}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
                {/* Если есть номер эпизода, покажем метку */}
                {item.episode_number && (
                  <div className="absolute top-2 left-2 bg-neo-pink text-white text-xs px-2 py-0.5 rounded-full">
                    Серия {item.episode_number}
                  </div>
                )}
              </div>
              <div className="p-2">
                <h3 className="text-sm font-semibold truncate">{animeData.title_ru}</h3>
                {animeData.genres && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {animeData.genres.slice(0, 2).map((g: any) => (
                      <span key={g.slug} className="text-xs bg-neo-pink/20 text-neo-pink px-1.5 py-0.5 rounded-full">
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