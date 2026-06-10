'use client'
import React, { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimeCard } from './AnimeCard'

interface AnimeItem {
  id: string
  title_ru: string
  poster_url: string
  rating?: number
  genres?: { name: string; slug: string }[]
  year?: number
  type?: string
}

interface AnimeCarouselProps {
  title: string
  items: AnimeItem[]
  icon?: React.ReactNode
}

export function AnimeCarousel({ title, items, icon }: AnimeCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 5)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
    }
  }

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' })
      setTimeout(checkScroll, 350)
    }
  }

  useEffect(() => {
    const ref = scrollRef.current
    if (!ref) return
    ref.addEventListener('scroll', checkScroll, { passive: true })
    checkScroll()
    return () => ref.removeEventListener('scroll', checkScroll)
  }, [])

  if (!items || items.length === 0) return null

  return (
    <div className="relative group mb-10">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        {icon}
        <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
      </div>

      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        >
          {items.map((item) => (
            <AnimeCard
              key={item.id}
              id={item.id}
              title={item.title_ru}
              poster_url={item.poster_url}
              rating={item.rating}
              genres={item.genres}
              year={item.year}
              type={item.type}
            />
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Fade edges */}
        {canScrollLeft && <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-neo-dark to-transparent z-10 pointer-events-none" />}
        {canScrollRight && <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-neo-dark to-transparent z-10 pointer-events-none" />}
      </div>
    </div>
  )
}