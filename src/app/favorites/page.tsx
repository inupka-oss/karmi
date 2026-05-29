'use client'
import { useEffect, useState } from 'react'
import AnimeGrid from '@/components/AnimeGrid'
import AnimeGridSkeleton from '@/components/AnimeGridSkeleton'

function getAccessToken(): string | null {
  const match = document.cookie.match(/sb-access-token=([^;]+)/)
  return match ? match[1] : null
}

export default function FavoritesPage() {
  const [anime, setAnime] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  useEffect(() => {
    const token = getAccessToken()
    const loadFavorites = async () => {
      let ids: string[] = []
      if (token) {
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
        } catch {}
      } else {
        const stored = localStorage.getItem('karmi-favorites')
        ids = stored ? JSON.parse(stored) : []
      }

      if (ids.length === 0) {
        setAnime([])
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
      } else {
        setAnime([])
      }
      setLoading(false)
    }
    loadFavorites()
  }, [supabaseUrl, supabaseAnonKey])

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 text-glow-white">♥ Избранное</h1>
        <AnimeGridSkeleton count={8} />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto">
      <h1 className="text-5xl md:text-7xl font-bold mb-4 text-glow-white">♥ Избранное</h1>
      {anime && anime.length === 0 && <p className="text-gray-400">Вы ничего не добавили в избранное.</p>}
      {anime && anime.length > 0 && <AnimeGrid anime={anime} />}
    </div>
  )
}