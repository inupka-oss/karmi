'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Star, ChevronLeft, ChevronRight, Info } from 'lucide-react'
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

/* ─── Geometric animated shapes background ─── */
function HeroShapes() {
  const shapes = [
    { w: 500, h: 120, rot: 12, grad: 'from-purple-500/[0.12]', pos: 'left-[-5%] top-[15%]', delay: 0.3 },
    { w: 400, h: 100, rot: -15, grad: 'from-pink-500/[0.10]', pos: 'right-[-3%] top-[65%]', delay: 0.5 },
    { w: 250, h: 70, rot: -8, grad: 'from-violet-500/[0.10]', pos: 'left-[8%] bottom-[10%]', delay: 0.4 },
    { w: 180, h: 50, rot: 20, grad: 'from-amber-500/[0.08]', pos: 'right-[15%] top-[12%]', delay: 0.6 },
    { w: 120, h: 35, rot: -25, grad: 'from-cyan-500/[0.08]', pos: 'left-[20%] top-[8%]', delay: 0.7 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: -150, rotate: s.rot - 15 }}
          animate={{ opacity: 1, y: 0, rotate: s.rot }}
          transition={{ duration: 2.4, delay: s.delay, ease: [0.23, 0.86, 0.39, 0.96] }}
          className={`absolute ${s.pos}`}
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 10 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: s.w, height: s.h }}
          >
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-r to-transparent ${s.grad} backdrop-blur-[2px] border border-white/[0.08] shadow-[0_8px_32px_0_rgba(255,255,255,0.05)]`}
            />
          </motion.div>
        </motion.div>
      ))}
      {/* Ambient glow orbs */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-purple-600/[0.07] rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/[0.06] rounded-full blur-[100px]" />
    </div>
  )
}

/* ─── Dot pattern overlay ─── */
function DotPattern() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.04]"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    />
  )
}

/* ─── Edge lighting lines ─── */
function EdgeLighting() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  )
}

export function PremiumHero({ items }: { items: HeroAnime[] }) {
  const [current, setCurrent] = useState(0)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const h = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  // Auto-rotate
  useEffect(() => {
    if (items.length <= 1) return
    const t = setInterval(() => setCurrent(p => (p + 1) % items.length), 8000)
    return () => clearInterval(t)
  }, [items.length])

  const go = (dir: 'prev' | 'next') => {
    setCurrent(p => dir === 'next' ? (p + 1) % items.length : (p === 0 ? items.length - 1 : p - 1))
  }

  const heroOpacity = Math.max(0, 1 - scrollY / 500)
  const item = items[current]
  if (!item) return null

  return (
    <section className="relative h-[80vh] min-h-[550px] max-h-[750px] overflow-hidden">
      {/* Background - full-bleed banner */}
      <div className="absolute inset-0" style={{ opacity: heroOpacity }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            {item.banner_url ? (
              <Image src={item.banner_url} alt="" fill className="object-cover" priority />
            ) : item.poster_url ? (
              <Image src={item.poster_url} alt="" fill className="object-cover blur-sm scale-110" priority />
            ) : null}
            {/* Gradient overlays for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0612] via-transparent to-[#0a0612]/60" />
          </motion.div>
        </AnimatePresence>

        {/* Geometric shapes */}
        <HeroShapes />
        <DotPattern />
        <EdgeLighting />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6"
              >
                <div className="w-2 h-2 rounded-full bg-rose-500/80 animate-pulse" />
                <span className="text-sm text-white/60 tracking-wide">Сейчас выходит</span>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 leading-[1.1]"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                  {item.title_ru}
                </span>
              </motion.h1>

              {/* English title */}
              {item.title_en && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/30 text-sm mb-4"
                >
                  {item.title_en}
                </motion.p>
              )}

              {/* Meta row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-4 mb-4"
              >
                {item.rating && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-bold text-sm">{item.rating.toFixed(1)}</span>
                  </div>
                )}
                {item.year && <span className="text-white/40 text-sm">{item.year}</span>}
                <div className="flex gap-2">
                  {item.genres?.slice(0, 3).map((g) => (
                    <Badge key={g.slug} variant="secondary" className="text-[11px]">
                      {g.name}
                    </Badge>
                  ))}
                </div>
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-base text-white/50 mb-8 leading-relaxed line-clamp-3 max-w-lg"
              >
                {item.description}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex gap-3"
              >
                <Link href={`/anime/${item.id}`}>
                  <Button size="lg" className="text-base px-8">
                    <Play className="w-5 h-5 mr-1 fill-white" />
                    Смотреть
                  </Button>
                </Link>
                <Link href={`/anime/${item.id}`}>
                  <Button size="lg" variant="outline" className="text-base px-8">
                    <Info className="w-5 h-5 mr-1" />
                    Подробнее
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => go('prev')}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all opacity-0 hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => go('next')}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all opacity-0 hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === current
                  ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_rgba(139,92,246,0.4)]'
                  : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0612] to-transparent pointer-events-none z-10" />
    </section>
  )
}