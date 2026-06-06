'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Related {
  id: string
  related_id: string
  relation_type: string
}

export default function RelatedAnime({ animeId }: { animeId: string }) {
  const [related, setRelated] = useState<any[]>([])
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  useEffect(() => {
    const load = async () => {
      const relRes = await fetch(`${supabaseUrl}/rest/v1/related_anime?anime_id=eq.${animeId}`, {
        headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
      })
      if (!relRes.ok) return
      const relData: Related[] = await relRes.json()
      if (relData.length === 0) return

      const ids = relData.map(r => r.related_id).join(',')
      const animeRes = await fetch(`${supabaseUrl}/rest/v1/anime?id=in.(${ids})&select=*`, {
        headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
      })
      const animeData = await animeRes.json()
      const merged = relData.map(rel => {
        const anime = animeData.find((a: any) => a.id === rel.related_id)
        return { ...anime, relation_type: rel.relation_type }
      })
      setRelated(merged)
    }
    load()
  }, [animeId])

  if (related.length === 0) return null

  const typeLabels: Record<string, string> = {
    sequel: 'Сиквел',
    prequel: 'Приквел',
    'spin-off': 'Спин-офф',
    movie: 'Фильм',
    ova: 'OVA',
    special: 'Спешл',
    alternative: 'Альтернатива',
  }

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-white mb-4">Связанное</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {related.map(item => (
          <Link 
            href={`/anime/${item.id}`} 
            key={item.id} 
            className="group glass rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-neon"
          >
            <div className="aspect-[3/4] relative overflow-hidden">
              <img 
                src={item.poster_url || '/placeholder.jpg'} 
                alt={item.title_ru} 
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" 
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-black/40 p-2 text-center text-xs text-white font-medium">
                {typeLabels[item.relation_type] || item.relation_type}
              </div>
            </div>
            <div className="p-2">
              <div className="text-white text-sm font-medium truncate" title={item.title_ru}>
                {item.title_ru}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}