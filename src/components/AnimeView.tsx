'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Play, Star, Eye, Users, Share2, Tv, Calendar, CheckCircle, Clapperboard, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import StarRating from './StarRating'
import RatingForm from './RatingForm'
import CommentSection from './CommentSection'
import RelatedAnime from './RelatedAnime'
import EpisodeList from './EpisodeList'
import AnimeActions from './AnimeActions'
import ScreenshotGallery from './ScreenshotGallery'
import AIRecommendations from './AIRecommendations'
import { useNotifications } from '@/hooks/useNotifications'
import { useActiveViewers } from '@/hooks/useActiveViewers'

interface Episode { id: string; episode_number: number; title?: string; video_url: string }
interface Anime {
  id: string; title_ru: string; title_en?: string; description?: string; year?: number
  rating?: number; poster_url?: string; banner_url?: string; type?: string; status?: string
  genres: any[]; studio?: string; director?: string; cast?: string; trailer_url?: string; views?: number
}

function getAccessToken(): string | null {
  const match = document.cookie.match(/sb-access-token=([^;]+)/)
  return match ? match[1] : null
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.1 + i * 0.1, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] } }),
}

export default function AnimeView({ anime, genres, episodes }: { anime: Anime; genres: any[]; episodes: Episode[] }) {
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null)
  const [progress, setProgress] = useState<{ episodeId: string; time: number } | null>(null)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const [shareUrl, setShareUrl] = useState('')
  const activeViewers = useActiveViewers(anime.id)

  useEffect(() => { setShareUrl(window.location.href) }, [])

  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      const load = async () => {
        try {
          const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` } })
          if (!userRes.ok) return
          const user = await userRes.json()
          const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_identifier=eq.${user.id}`, { headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` } })
          if (res.ok) { const d = await res.json(); if (d[0]?.progress) setProgress(d[0].progress) }
        } catch {}
      }
      load()
    } else {
      const s = localStorage.getItem('karmi-progress')
      if (s) try { setProgress(JSON.parse(s)) } catch {}
    }
  }, [supabaseUrl, supabaseAnonKey])

  const handleStartWatching = (ep: Episode) => setActiveEpisode(ep)
  const handleContinueWatching = (ep: Episode) => setActiveEpisode(ep)

  return (
    <div className="min-h-screen">
      {/* ─── Cinematic Hero ─── */}
      <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          {anime.banner_url ? (
            <Image src={anime.banner_url} alt="" fill className="object-cover" priority />
          ) : anime.poster_url ? (
            <Image src={anime.poster_url} alt="" fill className="object-cover blur-md scale-110" priority />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0612]/95 via-[#0a0612]/70 to-[#0a0612]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0612] via-transparent to-[#0a0612]/50" />
        </div>

        {/* Geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[400px] h-[100px] rounded-full bg-purple-500/[0.06] blur-[80px] rotate-12" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[80px] rounded-full bg-pink-500/[0.05] blur-[60px] -rotate-15" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12">
            <div className="flex flex-col md:flex-row items-end gap-8">
              {/* Poster */}
              <motion.div
                custom={0} variants={fadeUp} initial="hidden" animate="visible"
                className="shrink-0 w-48 lg:w-56"
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(139,92,246,0.3)] ring-1 ring-white/10">
                  <Image src={anime.poster_url || '/placeholder.jpg'} alt={anime.title_ru} fill className="object-cover" priority />
                </div>
              </motion.div>

              {/* Title & meta */}
              <div className="flex-1 min-w-0">
                <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">{anime.title_ru}</span>
                  </h1>
                </motion.div>
                {anime.title_en && (
                  <motion.p custom={2} variants={fadeUp} initial="hidden" animate="visible" className="text-white/30 text-lg mt-1">{anime.title_en}</motion.p>
                )}
                <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-wrap items-center gap-3 mt-4">
                  {genres.map((g: any) => (
                    <Badge key={g.slug} variant="secondary" className="text-xs">{g.name}</Badge>
                  ))}
                  {anime.rating && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-bold text-sm">{anime.rating.toFixed(1)}</span>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0612] to-transparent z-10" />
      </div>

      {/* ─── Main Content ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left sidebar */}
          <div className="w-full lg:w-72 shrink-0 space-y-6">
            {/* Action buttons */}
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="space-y-3">
              <AnimeActions
                trailerUrl={anime.trailer_url}
                episodes={episodes}
                onStartWatching={handleStartWatching}
                onContinueWatching={handleContinueWatching}
                progress={progress}
              />
            </motion.div>

            {/* Social share */}
            {shareUrl && (
              <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="flex gap-2">
                <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(anime.title_ru)}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 border border-[#2AABEE]/20 text-[#2AABEE] px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-center backdrop-blur-sm">
                  Telegram
                </a>
                <a href={`https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(anime.title_ru)}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 bg-[#0077FF]/10 hover:bg-[#0077FF]/20 border border-[#0077FF]/20 text-[#0077FF] px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-center backdrop-blur-sm">
                  VK
                </a>
              </motion.div>
            )}

            {/* Info cards */}
            <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="space-y-3">
              <Card className="bg-white/[0.03] border-white/5 p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Tv className="w-4 h-4 text-neo-purple" />
                  <span className="text-white/40">Тип:</span>
                  <span className="text-white/80">{anime.type || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-neo-purple" />
                  <span className="text-white/40">Год:</span>
                  <span className="text-white/80">{anime.year || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-neo-purple" />
                  <span className="text-white/40">Статус:</span>
                  <span className="text-white/80">{anime.status || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Eye className="w-4 h-4 text-neo-purple" />
                  <span className="text-white/40">Просмотры:</span>
                  <span className="text-white/80">{anime.views || 0}</span>
                </div>
                {activeViewers > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>
                    <span className="text-green-400">{activeViewers} смотрят</span>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Creators */}
            {(anime.studio || anime.director || anime.cast) && (
              <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
                <Card className="bg-white/[0.03] border-white/5 p-4">
                  <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Создатели</h3>
                  <div className="space-y-2 text-sm">
                    {anime.studio && <div><span className="text-white/40">Студия:</span> <span className="text-white/80">{anime.studio}</span></div>}
                    {anime.director && <div><span className="text-white/40">Режиссёр:</span> <span className="text-white/80">{anime.director}</span></div>}
                    {anime.cast && <div><span className="text-white/40">Актёры:</span> <span className="text-white/80">{anime.cast}</span></div>}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Rating */}
            <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
              <RatingForm animeId={anime.id} />
            </motion.div>
          </div>

          {/* Right content */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Description */}
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
              <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Описание</h3>
              <p className="text-white/60 leading-relaxed">{anime.description}</p>
            </motion.div>

            {/* Episodes */}
            <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
              <EpisodeList
                episodes={episodes}
                activeEpisode={activeEpisode || episodes[0] || null}
                onSelectEpisode={setActiveEpisode}
                activeEpisodeId={activeEpisode?.id || episodes[0]?.id}
              />
            </motion.div>

            {/* Screenshots */}
            <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
              <ScreenshotGallery animeId={anime.id} />
            </motion.div>

            {/* Related */}
            <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
              <RelatedAnime animeId={anime.id} />
            </motion.div>

            {/* AI Recommendations */}
            <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
              <AIRecommendations animeId={anime.id} />
            </motion.div>

            {/* Comments */}
            <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible">
              <CommentSection animeId={anime.id} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}