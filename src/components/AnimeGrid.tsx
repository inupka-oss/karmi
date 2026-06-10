'use client'
import Image from 'next/image'
import Link from 'next/link'
import { memo, useCallback } from 'react'
import type { Anime } from '@/types/anime'
import FavoriteButton from './FavoriteButton'
import StarRatingInline from './StarRatingInline'
import { useRatings } from '@/hooks/useRatings'

interface AnimeCardProps {
  item: Anime
}

const AnimeCard = memo(({ item }: AnimeCardProps) => {
  const { ratings, setRating } = useRatings()

  const handleRate = useCallback(
    (_animeId: string, rating: number) => {
      setRating(item.id, rating)
    },
    [item.id, setRating]
  )

  return (
    <Link href={`/anime/${item.id}`} className="block group">
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-500 bg-white/[0.03] border border-white/[0.06] hover:border-neo-purple/40 hover:shadow-[0_8px_40px_rgba(139,92,246,0.2)] hover:-translate-y-2 gradient-glow"
        role="article"
        aria-label={item.title_ru}
      >
        {/* Постер */}
        <div className="aspect-[3/4] relative overflow-hidden">
          <Image
            src={item.poster_url || '/placeholder.jpg'}
            alt={item.title_ru}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 20vw"
            loading="lazy"
          />
          
          {/* Градиент — всегда виден снизу, усиливается при наведении */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
          
          {/* Избранное */}
          <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <FavoriteButton animeId={item.id} />
          </div>
          
          {/* Бейдж типа */}
          <div className="absolute top-2 left-2 z-20">
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-black/60 backdrop-blur-sm text-white/80 px-2 py-1 rounded-md">
              {item.type}
            </span>
          </div>
          
          {/* Информация при наведении */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <span className="text-white/70 text-xs font-medium">
              {item.year}
            </span>
          </div>
          
          {/* Блик при наведении */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent transform -skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700" />
          </div>
        </div>
        
        {/* Контент */}
        <div className="p-3 space-y-2">
          <h3 className="font-semibold text-white text-sm truncate group-hover:text-neo-purple-light transition-colors duration-300" title={item.title_ru}>
            {item.title_ru}
          </h3>
          <div className="flex flex-wrap gap-1">
            {item.genres?.slice(0, 2).map((g) => (
              <span
                key={g.slug}
                className="text-[10px] bg-neo-purple/10 text-neo-purple-light/80 px-2 py-0.5 rounded-full font-medium border border-neo-purple/10"
              >
                {g.name}
              </span>
            ))}
          </div>
          <StarRatingInline
            animeId={item.id}
            currentRating={ratings[item.id]}
            onRate={handleRate}
          />
        </div>
      </div>
    </Link>
  )
})

AnimeCard.displayName = 'AnimeCard'

interface AnimeGridProps {
  anime: Anime[]
}

export default function AnimeGrid({ anime }: AnimeGridProps) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mt-8"
      role="list"
      aria-label="Список аниме"
    >
      {anime.map((item, index) => (
        <div key={item.id}>
          <AnimeCard item={item} />
        </div>
      ))}
    </div>
  )
}