'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import FavoriteButton from './FavoriteButton'
import { createClient } from '@supabase/supabase-js'

interface AnimeItem {
  id: string
  title_ru: string
  poster_url: string
  rating?: number
  genres?: any[]
}

function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/sb-access-token=([^;]+)/)
  return match ? match[1] : null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<AnimeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        let genreIds: string[] = []
        const token = getAccessToken()

        // Получаем любимые аниме пользователя
        if (token) {
          const { data: userData } = await supabase.auth.getUser(token)
          if (userData.user) {
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('favorites')
              .eq('user_identifier', userData.user.id)
              .single()
            
            if (profileData?.favorites) {
              const favIds = profileData.favorites
              const { data: animeData } = await supabase
                .from('anime')
                .select('id, genres(id)')
                .in('id', favIds)
              
              if (animeData) {
                const allGenreIds = new Set<string>()
                animeData.forEach((a: any) => {
                  a.genres?.forEach((g: any) => allGenreIds.add(g.id))
                })
                genreIds = Array.from(allGenreIds).slice(0, 5)
              }
            }
          }
        }

        // Если нет избранных, берём популярные жанры
        if (genreIds.length === 0) {
          const { data: genresData } = await supabase
            .from('genres')
            .select('id')
            .order('popularity', { ascending: false })
            .limit(5)
          
          if (genresData) {
            genreIds = genresData.map((g: any) => g.id)
          }
        }

        // Получаем рекомендации
        if (genreIds.length > 0) {
          const { data: recData } = await supabase
            .from('anime')
            .select('*, genres(name, slug)')
            .in('genres.id', genreIds)
            .order('rating', { ascending: false })
            .limit(10)
          
          if (recData) {
            // Убираем дубликаты
            const unique = recData.filter((v: any, i: number, a: any) => 
              a.findIndex((t: any) => t.id === v.id) === i
            ).slice(0, 10)
            setRecommendations(unique)
            setReason('На основе ваших предпочтений')
          }
        }
      } catch (e) {
        console.error('Load recommendations error:', e)
      } finally {
        setLoading(false)
      }
    }

    loadRecommendations()
  }, [])

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Рекомендуем вам</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="aspect-[3/4] glass rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) return null

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <span className="text-3xl">✨</span>
          Рекомендуем вам
        </h2>
        {reason && (
          <span className="text-sm text-gray-400 hidden sm:block">{reason}</span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {recommendations.map((item) => (
          <Link href={`/anime/${item.id}`} key={item.id} className="block group">
            <div className="relative glass rounded-2xl overflow-hidden transition-all duration-300 card-glow card-hover-glow hover:scale-[1.03] hover:-translate-y-1">
              <div className="absolute top-2 right-2 z-10">
                <FavoriteButton animeId={item.id} />
              </div>
              <div className="aspect-[3/4] relative overflow-hidden">
                <Image
                  src={item.poster_url || '/placeholder.jpg'}
                  alt={item.title_ru}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
                {item.rating && (
                  <div className="absolute bottom-2 left-2 bg-yellow-500/90 text-black px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                    ⭐ {item.rating.toFixed(1)}
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-bold text-white truncate">{item.title_ru}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.genres?.slice(0, 2).map((g: any) => (
                    <span key={g.slug} className="text-xs bg-neo-pink/20 text-neo-pink px-2 py-0.5 rounded-full">
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
