'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

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

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  useEffect(() => {
    resetTimeout()
    if (!isPaused && items.length > 1) {
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex(prev => (prev === items.length - 1 ? 0 : prev + 1))
      }, 6000)
    }
    return () => resetTimeout()
  }, [currentIndex, isPaused, items.length])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? items.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev === items.length - 1 ? 0 : prev + 1))
  }

  if (!items || items.length === 0) return null

  const currentItem = items[currentIndex]

  return (
    <div 
      className="relative w-full h-[400px] sm:h-[500px] lg:h-[550px] overflow-hidden rounded-3xl mb-12 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Слайды */}
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Баннер или градиент */}
          <div className="absolute inset-0">
            {item.banner_url ? (
              <Image
                src={item.banner_url}
                alt={item.title_ru}
                fill
                className="object-cover"
                priority={index === 0}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-neo-pink/30 via-purple-900/50 to-blue-900/50" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          </div>

          {/* Контент */}
          <div className="relative h-full flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Постер */}
                <div className="flex-shrink-0 w-40 sm:w-56 lg:w-72">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-neo-purple/30 ring-1 ring-white/10">
                    <Image
                      src={item.poster_url}
                      alt={item.title_ru}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                  </div>
                </div>

                {/* Информация */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 text-glow-white">
                    {item.title_ru}
                  </h1>
                  {item.title_en && (
                    <p className="text-base sm:text-lg text-gray-300 mb-3">{item.title_en}</p>
                  )}
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                    {item.genres?.slice(0, 4).map((g: any) => (
                      <span 
                        key={g.slug} 
                        className="bg-neo-purple/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400 text-lg">⭐</span>
                      <span className="text-white font-bold text-lg">{item.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    {item.year && (
                      <span className="text-gray-400 text-sm">{item.year}</span>
                    )}
                  </div>

                  <p className="text-gray-300 text-sm sm:text-base mb-5 line-clamp-3 max-w-2xl">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <Link
                      href={`/anime/${item.id}`}
                       className="inline-flex items-center gap-2 bg-gradient-to-r from-neo-purple to-neo-pink hover:from-neo-purple-dark hover:to-neo-pink-dark text-white px-6 sm:px-8 py-2.5 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 text-sm sm:text-base shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)]"
                     >
                       Смотреть
                    </Link>
                    <Link
                      href={`/anime/${item.id}`}
                       className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 sm:px-8 py-2.5 rounded-full font-semibold transition-all duration-300 text-sm sm:text-base border border-white/10 hover:border-white/20"
                     >
                       Подробнее
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Навигация - стрелки */}
      {items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 backdrop-blur-md text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 border border-white/10"
            aria-label="Предыдущий"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 backdrop-blur-md text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 border border-white/10"
            aria-label="Следующий"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Индикаторы */}
      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-500 rounded-full ${
                index === currentIndex
                  ? 'w-8 h-3 bg-gradient-to-r from-neo-purple to-neo-pink shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                  : 'w-3 h-3 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Слайд ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Прогресс бар */}
      {items.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
          <div
            className="h-full bg-gradient-to-r from-neo-purple to-neo-pink transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
