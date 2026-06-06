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
        className="relative glass rounded-2xl overflow-hidden transition-all duration-300 card-glow hover:scale-[1.02] hover:-translate-y-1 bg-neo-dark/50"
        role="article"
        aria-label={item.title_ru}
      >
        <div className="absolute top-2 right-2 z-20">
          <FavoriteButton animeId={item.id} />
        </div>
        <div className="aspect-[3/4] relative overflow-hidden">
          <Image
            src={item.poster_url || '/placeholder.jpg'}
            alt={item.title_ru}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 20vw"
            loading="lazy"
          />
          {/* Градиент при наведении */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Информация внизу при наведении */}
          <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-white text-xs font-medium">
              {item.type} • {item.year}
            </span>
          </div>
          
          {/* Блик при наведении */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent transform -skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700" />
          </div>
        </div>
        <div className="p-3 space-y-2">
          <h3 className="font-bold text-white truncate" title={item.title_ru}>
            {item.title_ru}
          </h3>
          <div className="flex flex-wrap gap-1">
            {item.genres?.slice(0, 2).map((g) => (
              <span
                key={g.slug}
                className="text-xs bg-neo-purple/15 text-neo-purple-light px-2 py-0.5 rounded-full font-medium"
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
        <div key={item.id} className="animate-stagger-fade-in" style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}>
          <AnimeCard item={item} />
        </div>
      ))}
    </div>
  )
}