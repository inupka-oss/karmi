'use client'
import Image from 'next/image'
import Link from 'next/link'
import FavoriteButton from './FavoriteButton'

export default function AnimeGrid({ anime }: { anime: any[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mt-8">
      {anime.map((item) => (
        <Link href={`/anime/${item.id}`} key={item.id} className="block group">
          <div className="relative glass rounded-2xl overflow-hidden transition-all duration-300 card-glow card-hover-glow animate-fade-in hover:scale-[1.03] hover:-translate-y-1">
            <div className="absolute top-2 right-2 z-10">
              <FavoriteButton animeId={item.id} />
            </div>
            <div className="aspect-[3/4] relative overflow-hidden">
              <Image
                src={item.poster_url || '/placeholder.jpg'}
                alt={item.title_ru}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 20vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <span className="text-white text-sm font-medium">{item.type}/{item.year}</span>
              </div>
              {/* Блик */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 via-transparent to-transparent transform -skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000"></div>
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-bold truncate">{item.title_ru}</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {item.genres?.slice(0, 2).map((g: any) => (
                  <span key={g.slug} className="text-xs bg-neo-pink/20 text-neo-pink px-2 py-0.5 rounded-full">
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}