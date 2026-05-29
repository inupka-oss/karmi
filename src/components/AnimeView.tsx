'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import StarRating from './StarRating'
import RatingForm from './RatingForm'
import CommentSection from './CommentSection'
import RelatedAnime from './RelatedAnime'
import EpisodeList from './EpisodeList'
import AnimeActions from './AnimeActions'
import ScreenshotGallery from './ScreenshotGallery'
import { useNotifications } from '@/hooks/useNotifications'

interface Episode {
  id: string
  episode_number: number
  title?: string
  video_url: string
}

interface Anime {
  id: string
  title_ru: string
  title_en?: string
  description?: string
  year?: number
  rating?: number
  poster_url?: string
  type?: string
  status?: string
  genres: any[]
  studio?: string
  director?: string
  cast?: string
  trailer_url?: string
  views?: number
}

function getAccessToken(): string | null {
  const match = document.cookie.match(/sb-access-token=([^;]+)/)
  return match ? match[1] : null
}

export default function AnimeView({
  anime,
  genres,
  episodes,
}: {
  anime: Anime
  genres: any[]
  episodes: Episode[]
}) {
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null)
  const [progress, setProgress] = useState<{ episodeId: string; time: number } | null>(null)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const [shareUrl, setShareUrl] = useState('')

  // Уведомления
  const { subscriptions, toggleSubscription } = useNotifications()

  useEffect(() => {
    setShareUrl(window.location.href)
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      const loadCloudProgress = async () => {
        try {
          const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
          })
          if (!userRes.ok) return
          const user = await userRes.json()
          const userId = user.id

          const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_identifier=eq.${userId}`, {
            headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json()
            if (data.length > 0 && data[0].progress) {
              setProgress(data[0].progress)
            }
          }
        } catch {}
      }
      loadCloudProgress()
    } else {
      const stored = localStorage.getItem('karmi-progress')
      if (stored) {
        try {
          setProgress(JSON.parse(stored))
        } catch {}
      }
    }
  }, [supabaseUrl, supabaseAnonKey])

  const handleStartWatching = (ep: Episode) => setActiveEpisode(ep)
  const handleContinueWatching = (ep: Episode) => setActiveEpisode(ep)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 lg:w-1/4">
          <div className="aspect-[3/4] relative rounded-2xl overflow-hidden glass">
            <Image
              src={anime.poster_url || '/placeholder.jpg'}
              alt={anime.title_ru}
              fill
              className="object-cover"
            />
          </div>
          <AnimeActions
            trailerUrl={anime.trailer_url}
            episodes={episodes}
            onStartWatching={handleStartWatching}
            onContinueWatching={handleContinueWatching}
            progress={progress}
          />
          {/* Кнопки "Поделиться" */}
          {shareUrl && (
            <div className="flex gap-2 mt-4">
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(anime.title_ru)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#2AABEE] hover:bg-[#2291c7] text-white px-3 py-2 rounded-xl text-xs font-semibold transition flex-1 text-center"
              >
                Telegram
              </a>
              <a
                href={`https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(anime.title_ru)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0077FF] hover:bg-[#0066dd] text-white px-3 py-2 rounded-xl text-xs font-semibold transition flex-1 text-center"
              >
                VK
              </a>
            </div>
          )}
          {/* Кнопка подписки */}
          <button
            onClick={() => toggleSubscription(anime.id)}
            className={`mt-3 w-full px-4 py-2 rounded-xl text-sm font-semibold transition ${
              subscriptions.includes(anime.id)
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/30'
                : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
            }`}
          >
            {subscriptions.includes(anime.id) ? '🔔 Вы подписаны' : '🔔 Подписаться на новые серии'}
          </button>
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-white">{anime.title_ru}</h1>
          {anime.title_en && <h2 className="text-xl text-gray-400 mt-1">{anime.title_en}</h2>}
          <div className="flex flex-wrap gap-2 mt-3">
            {genres.map((g: any) => (
              <span key={g.slug} className="bg-neo-pink/20 text-neo-pink px-3 py-1 rounded-full text-sm">
                {g.name}
              </span>
            ))}
          </div>
          <p className="mt-4 text-gray-300 leading-relaxed">{anime.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm text-white">
            <div><span className="text-gray-500">Тип:</span> {anime.type}</div>
            <div><span className="text-gray-500">Год:</span> {anime.year}</div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Рейтинг:</span>
              <StarRating rating={anime.rating || 0} />
            </div>
            <div><span className="text-gray-500">Статус:</span> {anime.status}</div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
            <span>👁 {anime.views || 0} просмотров</span>
          </div>
          <RatingForm animeId={anime.id} />

          {(anime.studio || anime.director || anime.cast) && (
            <div className="mt-6 glass p-4 rounded-xl">
              <h2 className="text-lg font-semibold text-white mb-2">Создатели</h2>
              <div className="space-y-1 text-sm text-gray-300">
                {anime.studio && <div><span className="text-gray-500">Студия:</span> {anime.studio}</div>}
                {anime.director && <div><span className="text-gray-500">Режиссёр:</span> {anime.director}</div>}
                {anime.cast && <div><span className="text-gray-500">Актёры/сэйю:</span> {anime.cast}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      <EpisodeList
        episodes={episodes}
        activeEpisode={activeEpisode || episodes[0] || null}
        onSelectEpisode={setActiveEpisode}
        activeEpisodeId={activeEpisode?.id || episodes[0]?.id}
      />

      <ScreenshotGallery animeId={anime.id} />
      <RelatedAnime animeId={anime.id} />
      <CommentSection animeId={anime.id} />
    </div>
  )
}