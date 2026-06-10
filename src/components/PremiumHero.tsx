'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Star, Flame, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface HeroAnime {
  id: string
  title_ru: string
  title_en?: string
  description?: string
  poster_url: string
  banner_url?: string
  rating?: number
  genres?: { name: string; slug: string }[]
  year?: number
}

const FloatingPoster: React.FC<{ anime: HeroAnime; index: number }> = ({ anime, index }) => {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    }
    window.addEventListener('mousemove', handle, { passive: true })
    return () => window.removeEventListener('mousemove', handle)
  }, [])

  const offsetX = (mouse.x - 0.5) * (15 + index * 4)
  const offsetY = (mouse.y - 0.5) * (15 + index * 4)

  return (
    <motion.div
      className="absolute hidden lg:block"
      style={{ left: `${10 + index * 14}%`, top: `${15 + (index % 3) * 20}%` }}
      animate={{ x: offsetX, y: offsetY, rotate: Math.sin(index * 1.2) * 3 }}
      transition={{ type: "spring", stiffness: 40, damping: 20 }}
    >
      <motion.div whileHover={{ scale: 1.1, zIndex: 50 }} className="relative group cursor-pointer">
        <div className="w-32 h-44 rounded-lg overflow-hidden shadow-2xl border border-purple-500/20">
          <Image src={anime.poster_url} alt={anime.title_ru} fill className="object-cover" sizes="128px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-white text-xs font-semibold truncate">{anime.title_ru}</p>
              {anime.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-white text-xs">{anime.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg blur-xl -z-10 opacity-50" />
      </motion.div>
    </motion.div>
  )
}

export function PremiumHero({ items }: { items: HeroAnime[] }) {
  const [scrollY, setScrollY] = useState(0)
  const currentItem = items[0]

  useEffect(() => {
    const handle = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handle, { passive: true })
    return () => window.removeEventListener('scroll', handle)
  }, [])

  const heroOpacity = Math.max(0, 1 - scrollY / 600)

  if (!currentItem) return null

  return (
    <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
      <div className="absolute inset-0" style={{ opacity: heroOpacity }}>
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/50 to-neo-dark" />

        {/* Floating posters */}
        <div className="absolute inset-0">
          {items.slice(0, 6).map((item, i) => (
            <FloatingPoster key={item.id} anime={item} index={i} />
          ))}
        </div>

        {/* Neon glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
      </div>

      {/* Hero content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-2xl"
          >
            {/* Badge */}
            <Badge className="mb-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 text-sm px-4 py-1.5">
              <Flame className="w-4 h-4 mr-2" />
              Новый сезон
            </Badge>

            {/* Title */}
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-5 leading-tight"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                {currentItem.title_ru}
              </span>
            </motion.h1>

            {/* Genres & info */}
            <motion.div
              className="flex flex-wrap items-center gap-3 mb-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {currentItem.genres?.slice(0, 3).map((g) => (
                <Badge key={g.slug} variant="secondary" className="text-xs">
                  {g.name}
                </Badge>
              ))}
              {currentItem.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-bold text-sm">{currentItem.rating.toFixed(1)}</span>
                </div>
              )}
              {currentItem.year && <span className="text-white/40 text-sm">{currentItem.year}</span>}
            </motion.div>

            {/* Description */}
            <motion.p
              className="text-lg text-gray-300/80 mb-8 leading-relaxed line-clamp-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {currentItem.description}
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              <Link href={`/anime/${currentItem.id}`}>
                <Button size="lg" className="text-lg px-8">
                  <Play className="w-5 h-5 mr-1 fill-white" />
                  Смотреть
                </Button>
              </Link>
              <Link href={`/anime/${currentItem.id}`}>
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Подробнее
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-6 h-10 border-2 border-purple-500/50 rounded-full flex items-start justify-center p-2">
          <motion.div
            className="w-1.5 h-1.5 bg-purple-500 rounded-full"
            animate={{ y: [0, 16, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </div>
      </motion.div>
    </section>
  )
}