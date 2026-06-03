'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

interface ProgressItem {
  episodeId: string
  time: number
  animeId?: string
  animeTitle?: string
  posterUrl?: string
  episodeNumber?: number
  duration?: number
}

function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/sb-access-token=([^;]+)/)
  return match ? match[1] : null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ContinueWatching() {
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProgress = async () => {
      const token = getAccessToken()
      const stored = localStorage.getItem('karmi-progress')
      
      if (!token && !stored) {
        setLoading(false)
        return
      }

      try {
        let progressData: ProgressItem[] = []

        // Загружаем из cloud если авторизован
        if (token) {
          const userRes = await supabase.auth.getUser(token)
          if (userRes.data.user) {
            const userId = userRes.data.user.id
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('progress')
              .eq('user_identifier', userId)
              .single()
            
            if (profileData?.progress) {
              progressData.push({
                episodeId: profileData.progress.episodeId,
                time: profileData.progress.time,
              })
            }
          }
        }

        // Добавляем из localStorage
        if (stored) {
          const localProgress = JSON.parse(stored)
          if (localProgress && !progressData.find(p => p.episodeId === localProgress.episodeId)) {
            progressData.push(localProgress)
          }
        }

        // Получаем информацию об эпизодах и аниме
        if (progressData.length > 0) {
          const enrichedProgress = await Promise.all(
            progressData.map(async (p) => {
              try {
                const { data: epData } = await supabase
                  .from('episodes')
                  .select('anime_id, episode_number, duration')
                  .eq('id', p.episodeId)
                  .single()
                
                if (epData) {
                  const { data: animeData } = await supabase
                    .from('anime')
                    .select('title_ru, poster_url')
                    .eq('id', epData.anime_id)
                    .single()
                  
                  if (animeData) {
                    return {
                      ...p,
                      animeId: epData.anime_id,
                      animeTitle: animeData.title_ru,
                      posterUrl: animeData.poster_url,
                      episodeNumber: epData.episode_number,
                      duration: epData.duration || 1440,
                    }
                  }
                }
              } catch {}
              return p
            })
          )
          setProgress(enrichedProgress.filter(p => p.animeId))
        }
      } catch (e) {
        console.error('Load progress error:', e)
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [])

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Продолжить просмотр</h2>
        <div className="glass rounded-2xl p-6 animate-pulse">
          <div className="h-32 bg-white/10 rounded-xl" />
        </div>
      </div>
    )
  }

  if (progress.length === 0) return null

  return (
    <div className="mb-12">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="text-3xl">📺</span>
        Продолжить просмотр
      </h2>
      <div className="grid gap-4">
        {progress.map((item) => {
          const percent = item.duration ? Math.min((item.time / item.duration) * 100, 100) : 0
          const timeLeft = item.duration ? Math.round(item.duration - item.time) : 0
          const minutesLeft = Math.floor(timeLeft / 60)

          return (
            <Link
              key={item.episodeId}
              href={`/anime/${item.animeId}`}
              className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-4 hover:bg-white/10 transition group"
            >
              {/* Постер */}
              <div className="flex-shrink-0 w-24 sm:w-32 relative aspect-[3/4] rounded-xl overflow-hidden">
                <Image
                  src={item.posterUrl || '/placeholder.jpg'}
                  alt={item.animeTitle || ''}
                  fill
                  className="object-cover group-hover:scale-110 transition duration-500"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <span className="text-white text-2xl">▶</span>
                </div>
              </div>

              {/* Информация */}
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1 group-hover:text-neo-pink transition">
                  {item.animeTitle}
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  Серия {item.episodeNumber}
                  {minutesLeft > 0 && (
                    <span className="ml-2 text-neo-pink">
                      • Осталось {minutesLeft} мин
                    </span>
                  )}
                </p>

                {/* Прогресс бар */}
                <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-neo-pink to-neo-red rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Прогресс: {Math.round(percent)}%
                </p>
              </div>

              {/* Кнопка продолжить */}
              <div className="flex items-center justify-center sm:justify-end">
                <button className="bg-neo-pink hover:bg-neo-pink/80 text-white px-6 py-3 rounded-xl font-semibold transition transform hover:scale-105">
                  Продолжить
                </button>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
