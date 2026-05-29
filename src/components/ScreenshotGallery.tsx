'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface Screenshot {
  id: string
  url: string
  order_index: number
}

export default function ScreenshotGallery({ animeId }: { animeId: string }) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${supabaseUrl}/rest/v1/screenshots?anime_id=eq.${animeId}&order=order_index.asc`, {
        headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setScreenshots(data)
      }
    }
    load()
  }, [animeId, supabaseUrl, supabaseAnonKey])

  if (screenshots.length === 0) return null

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-white mb-4">📸 Кадры из аниме</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {screenshots.map((sc) => (
          <div
            key={sc.id}
            className="flex-shrink-0 w-40 h-24 relative rounded-xl overflow-hidden cursor-pointer hover:ring-2 ring-neo-pink transition"
            onClick={() => setSelected(sc.url)}
          >
            <Image src={sc.url} alt="Кадр" fill className="object-cover" sizes="160px" />
          </div>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <Image src={selected} alt="Превью кадра" width={1200} height={675} className="rounded-xl object-contain" />
            <button
              onClick={() => setSelected(null)}
              className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}