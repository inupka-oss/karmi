'use client'
import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Star } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'

interface AnimeCardProps {
  id: string
  title: string
  poster_url: string
  rating?: number
  genres?: { name: string; slug: string }[]
  year?: number
  type?: string
  className?: string
}

export function AnimeCard({ id, title, poster_url, rating, genres, year, type, className }: AnimeCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, zIndex: 50 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`flex-shrink-0 w-48 sm:w-56 group cursor-pointer ${className}`}
    >
      <Link href={`/anime/${id}`}>
        <div className="relative rounded-xl overflow-hidden border border-white/5 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-purple-500/30 hover:shadow-[0_8px_40px_rgba(139,92,246,0.2)]">
          {/* Poster */}
          <div className="relative aspect-[3/4] overflow-hidden">
            <Image
              src={poster_url || '/placeholder.jpg'}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="224px"
              loading="lazy"
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />

            {/* Rating badge */}
            {rating && (
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-black/60 backdrop-blur-sm text-white border-0 text-xs">
                  <Star className="w-3 h-3 mr-0.5 fill-yellow-400 text-yellow-400" />
                  {rating.toFixed(1)}
                </Badge>
              </div>
            )}

            {/* Type badge */}
            {type && (
              <div className="absolute top-3 left-3 z-10">
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                  {type}
                </Badge>
              </div>
            )}

            {/* Play button on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
              <motion.div
                initial={{ scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/50"
              >
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </motion.div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {genres?.slice(0, 2).map((g) => (
                  <Badge key={g.slug} variant="secondary" className="text-[10px] bg-pink-600/60 backdrop-blur-sm text-white border-0">
                    {g.name}
                  </Badge>
                ))}
              </div>
              {year && <span className="text-white/50 text-xs">{year}</span>}
            </div>
          </div>

          {/* Title */}
          <div className="p-3">
            <h3 className="font-semibold text-white/90 text-sm truncate group-hover:text-white transition-colors">
              {title}
            </h3>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}