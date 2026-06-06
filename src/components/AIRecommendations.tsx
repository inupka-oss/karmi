'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface AnimeItem {
  id: string
  title_ru: string
  poster_url: string
  rating?: number
  genres?: any[]
  year?: number
  description?: string
}

interface Recommendation extends AnimeItem {
  matchScore: number
  matchReasons: string[]
}

function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/sb-access-token=([^;]+)/)
  return match ? match[1] : null
}

export default function AIRecommendations({ animeId }: { animeId: string }) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentAnime, setCurrentAnime] = useState<AnimeItem | null>(null)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true)
      try {
        // Получаем текущее аниме
        const currentRes = await fetch(`${supabaseUrl}/rest/v1/anime?id=eq.${animeId}&select=*,genres(id,name,slug)`, {
          headers: { 'apikey': supabaseAnonKey },
        })
        if (!currentRes.ok) return
        const currentData = await currentRes.json()
        if (currentData.length === 0) return
        
        const current = currentData[0]
        setCurrentAnime(current)

        // Получаем жанры текущего аниме
        const genreIds = current.genres?.map((g: any) => g.id) || []
        
        if (genreIds.length === 0) return

        // Ищем похожие аниме по жанрам
        const similarRes = await fetch(
          `${supabaseUrl}/rest/v1/anime?select=*,genres(id,name,slug)&genres.id=in.(${genreIds.join(',')})&not=id.eq.${animeId}&order=rating.desc&limit=20`,
          { headers: { 'apikey': supabaseAnonKey } }
        )
        
        if (!similarRes.ok) return
        const similarData = await similarRes.json()

        // Вычисляем score совпадения
        const recommendations: Recommendation[] = similarData.slice(0, 8).map((anime: any) => {
          const commonGenres = anime.genres?.filter((g: any) => genreIds.includes(g.id)) || []
          const matchScore = Math.round((commonGenres.length / genreIds.length) * 100)
          
          const reasons: string[] = []
          if (commonGenres.length >= 3) {
            reasons.push(`Похожие жанры: ${commonGenres.slice(0, 3).map((g: any) => g.name).join(', ')}`)
          }
          if (anime.year && current.year && Math.abs(anime.year - current.year) <= 2) {
            reasons.push(`Вышел в ${anime.year} году`)
          }
          if (anime.rating && current.rating && anime.rating >= current.rating - 0.5) {
            reasons.push(`Высокий рейтинг ${anime.rating.toFixed(1)}`)
          }
          if (anime.type === current.type) {
            reasons.push(`Такой же формат: ${anime.type}`)
          }

          return {
            ...anime,
            matchScore,
            matchReasons: reasons.slice(0, 3),
          }
        })

        setRecommendations(recommendations)
      } catch (e) {
        console.error('Load AI recommendations error:', e)
      } finally {
        setLoading(false)
      }
    }

    loadRecommendations()
  }, [animeId, supabaseUrl, supabaseAnonKey])

  if (loading) {
    return (
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          🤖 AI Рекомендации
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] glass rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) return null

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          🤖 AI Рекомендации
          <span className="text-xs bg-neo-purple/20 text-neo-purple-light px-2 py-1 rounded-full">
            На основе "{currentAnime?.title_ru}"
          </span>
        </h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.map((rec, idx) => (
          <Link
            key={rec.id}
            href={`/anime/${rec.id}`}
            className="group relative glass rounded-2xl overflow-hidden hover:ring-2 hover:ring-neo-purple/50 transition"
          >
            <div className="aspect-[3/4] relative">
              <Image
                src={rec.poster_url || '/placeholder.jpg'}
                alt={rec.title_ru}
                fill
                className="object-cover group-hover:scale-110 transition duration-500"
              />
              
              {/* Score badge */}
              <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-bold">
                {rec.matchScore}% совпадение
              </div>

              {/* Рейтинг */}
              {rec.rating && (
                <div className="absolute bottom-2 left-2 bg-yellow-500/90 text-black px-2 py-1 rounded-lg text-xs font-bold">
                  ⭐ {rec.rating.toFixed(1)}
                </div>
              )}
            </div>

            <div className="p-3">
              <h3 className="font-bold text-white truncate mb-2">{rec.title_ru}</h3>
              
              {/* Причины рекомендации */}
              <div className="space-y-1">
                {rec.matchReasons.slice(0, 2).map((reason, i) => (
                  <p key={i} className="text-xs text-gray-400 flex items-start gap-1">
                    <span className="text-neo-purple-light">•</span>
                    {reason}
                  </p>
                ))}
              </div>

              {/* Градиент при наведении */}
              <div className="absolute inset-0 bg-gradient-to-t from-neo-purple/20 to-transparent opacity-0 group-hover:opacity-100 transition pointer-events-none" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
