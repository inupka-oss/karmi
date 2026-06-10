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
      <div className="card-premium" role="article" aria-label={item.title_ru}>
        {/* Poster */}
        <div className="aspect-[3/4] relative overflow-hidden rounded-t-2xl">
          <Image
            src={item.poster_url || '/placeholder.jpg'}
            alt={item.title_ru}
            fill
            className="object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-110"
            sizes="(max-width: 768px) 50vw, 20vw"
            loading="lazy"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-500" />

          {/* Type badge */}
          <div className="absolute top-2.5 left-2.5 z-20">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-black/50 backdrop-blur-md text-white/90 px-2.5 py-1 rounded-lg border border-white/10">
              {item.type}
            </span>
          </div>

          {/* Favorite */}
          <div className="absolute top-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
            <FavoriteButton animeId={item.id} />
          </div>

          {/* Bottom info on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400">
            <div className="flex items-center gap-2 text-white/70 text-xs">
              <span>{item.year}</span>
              {item.rating && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="text-yellow-400">★ {item.rating.toFixed(1)}</span>
                </>
              )}
            </div>
          </div>

          {/* Shine effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/15 via-transparent to-transparent -skew-x-12 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-out" />
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <h3 className="font-semibold text-white/90 text-sm truncate group-hover:text-white transition-colors duration-300" title={item.title_ru}>
            {item.title_ru}
          </h3>
          <div className="flex flex-wrap gap-1">
            {item.genres?.slice(0, 2).map((g) => (
              <span
                key={g.slug}
                className="text-[10px] font-medium text-neo-purple-light/70 bg-neo-purple/10 px-2 py-0.5 rounded-full border border-neo-purple/10"
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
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5"
      role="list"
      aria-label="Список аниме"
    >
      {anime.map((item) => (
        <div key={item.id}>
          <AnimeCard item={item} />
        </div>
      ))}
    </div>
  )
}