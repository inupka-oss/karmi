'use client'
import { useEffect, useState } from 'react'
import AnimeGrid from '@/components/AnimeGrid'

function getAccessToken(): string | null {
  const match = document.cookie.match(/sb-access-token=([^;]+)/)
  return match ? match[1] : null
}

export default function FavoritesPage() {
  const [anime, setAnime] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  useEffect(() => {
    const token = getAccessToken()
    const loadFavorites = async () => {
      let ids: string[] = []
      if (token) {
        // Авторизован – берём из облака
        try {
          const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
          })
          if (!userRes.ok) throw new Error('Not auth')
          const user = await userRes.json()
          const userId = user.id

          const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_identifier=eq.${userId}`, {
            headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json()
            if (data.length > 0 && data[0].favorites) {
              ids = data[0].favorites
            }
          }
        } catch {
          // fallback к localStorage
        }
      } else {
        const stored = localStorage.getItem('karmi-favorites')
        ids = stored ? JSON.parse(stored) : []
      }

      if (ids.length === 0) {
        setLoading(false)
        return
      }

      const idsParam = ids.join(',')
      const animeRes = await fetch(`${supabaseUrl}/rest/v1/anime?id=in.(${idsParam})&select=*,genres(name,slug)`, {
        headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
      })
      if (animeRes.ok) {
        const animeData = await animeRes.json()
        setAnime(animeData)
      }
      setLoading(false)
    }
    loadFavorites()
  }, [supabaseUrl, supabaseAnonKey])

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto">
      <h1 className="text-5xl md:text-7xl font-bold mb-4 text-glow-white">♥ Избранное</h1>
      {loading && <p className="text-white">Загрузка...</p>}
      {!loading && anime.length === 0 && <p className="text-gray-400">Вы ничего не добавили в избранное.</p>}
      {anime.length > 0 && <AnimeGrid anime={anime} />}
    </div>
  )
}