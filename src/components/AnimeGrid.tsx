'use client'
import Image from 'next/image'
import Link from 'next/link'
import FavoriteButton from './FavoriteButton'

export default function AnimeGrid({ anime }: { anime: any[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-8">
      {anime.map((item) => (
        <Link href={`/anime/${item.id}`} key={item.id} className="block">
          <div className="relative glass rounded-2xl overflow-hidden transition-all card-glow card-hover-glow group h-full">
            <div className="absolute top-2 right-2 z-10">
              <FavoriteButton animeId={item.id} />
            </div>
            <div className="aspect-[3/4] relative">
              <Image
                src={item.poster_url || '/placeholder.jpg'}
                alt={item.title_ru}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 20vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <span className="text-white text-sm font-medium">{item.type}/{item.year}</span>
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