'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PlayIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons'

interface AnimeItem {
  id: string
  title_ru: string
  title_en?: string
  description?: string
  poster_url: string
  banner_url?: string
  rating?: number
  genres?: any[]
  year?: number
}

export default function HeroSlider({ items }: { items: AnimeItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimeout = () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }

  useEffect(() => {
    resetTimeout()
    if (!isPaused && items.length > 1) {
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex(prev => (prev === items.length - 1 ? 0 : prev + 1))
      }, 7000)
    }
    return () => resetTimeout()
  }, [currentIndex, isPaused, items.length])

  const goToSlide = (i: number) => setCurrentIndex(i)
  const goToPrevious = () => setCurrentIndex(p => (p === 0 ? items.length - 1 : p - 1))
  const goToNext = () => setCurrentIndex(p => (p === items.length - 1 ? 0 : p + 1))

  if (!items || items.length === 0) return null

  return (
    <div
      className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] overflow-hidden rounded-3xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
          }`}
        >
          {/* Background */}
          <div className="absolute inset-0">
            {item.banner_url ? (
              <Image src={item.banner_url} alt={item.title_ru} fill className="object-cover" priority={index === 0} />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-neo-purple-deep via-neo-dark to-neo-dark" />
            )}
            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-neo-dark via-neo-dark/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-neo-dark/90 via-neo-dark/40 to-transparent" />
            {/* Ambient glow */}
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-neo-purple/20 rounded-full blur-[100px] pointer-events-none" />
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                {/* Poster */}
                <div className="shrink-0 w-36 sm:w-48 lg:w-56 animate-float">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(139,92,246,0.3)] ring-1 ring-white/10">
                    <Image src={item.poster_url} alt={item.title_ru} fill className="object-cover" priority={index === 0} />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left max-w-xl">
                  {/* Genre tags */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                    {item.genres?.slice(0, 3).map((g: any) => (
                      <span key={g.slug} className="text-[11px] font-medium text-neo-purple-light/80 bg-neo-purple/15 backdrop-blur-sm px-3 py-1 rounded-full border border-neo-purple/20">
                        {g.name}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight">
                    {item.title_ru}
                  </h2>
                  {item.title_en && (
                    <p className="text-white/40 text-sm sm:text-base mb-3">{item.title_en}</p>
                  )}

                  {/* Rating & Year */}
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                    {item.rating && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-yellow-400 text-sm">★</span>
                        <span className="text-white font-bold text-sm">{item.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {item.year && <span className="text-white/30 text-sm">{item.year}</span>}
                  </div>

                  {/* Description */}
                  <p className="text-white/40 text-sm leading-relaxed mb-6 line-clamp-3">
                    {item.description}
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <Link href={`/anime/${item.id}`} className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm">
                      <PlayIcon className="w-4 h-4" />
                      Смотреть
                    </Link>
                    <Link href={`/anime/${item.id}`} className="btn-secondary inline-flex items-center gap-2 px-6 py-3 text-sm">
                      Подробнее
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white/60 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white/60 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === currentIndex
                  ? 'w-8 bg-gradient-to-r from-neo-purple to-neo-pink shadow-[0_0_12px_rgba(139,92,246,0.5)]'
                  : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {items.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 z-20">
          <div
            className="h-full bg-gradient-to-r from-neo-purple to-neo-pink transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}