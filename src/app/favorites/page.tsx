'use client'
import { useEffect, useState } from 'react'
import AnimeGrid from '@/components/AnimeGrid'

export default function FavoritesPage() {
  const [anime, setAnime] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('karmi-favorites')
    const ids: string[] = stored ? JSON.parse(stored) : []
    if (ids.length === 0) {
      setLoading(false)
      return
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const idsParam = ids.join(',')

    fetch(`${supabaseUrl}/rest/v1/anime?id=in.(${idsParam})&select=*,genres(name,slug)`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        setAnime(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto">
      <h1 className="text-5xl md:text-7xl font-bold mb-4 text-glow-white">♥ Избранное</h1>
      {loading && <p className="text-white">Загрузка...</p>}
      {!loading && anime.length === 0 && <p className="text-gray-400">Вы ничего не добавили в избранное.</p>}
      {anime.length > 0 && <AnimeGrid anime={anime} />}
    </div>
  )
}