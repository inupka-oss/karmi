'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import VideoPlayer from './VideoPlayer'

export default function EpisodeList({ animeId }: { animeId: string }) {
  const [episodes, setEpisodes] = useState<any[]>([])
  const [activeEp, setActiveEp] = useState<any>(null)

  useEffect(() => {
    const fetchEpisodes = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('episodes')
        .select('*')
        .eq('anime_id', animeId)
        .order('episode_number')
      if (data && data.length > 0) {
        setEpisodes(data)
        setActiveEp(data[0])
      }
    }
    fetchEpisodes()
  }, [animeId])

  return (
    <div className="mt-10">
      {activeEp && <VideoPlayer src={activeEp.video_url} title={activeEp.title || `Эпизод ${activeEp.episode_number}`} />}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
        {episodes.map((ep) => (
          <button
            key={ep.id}
            onClick={() => setActiveEp(ep)}
            className={`p-3 rounded-xl text-left transition ${
              activeEp?.id === ep.id ? 'bg-neo-pink text-white' : 'glass hover:bg-white/10'
            }`}
          >
            <div className="font-bold">Серия {ep.episode_number}</div>
            {ep.title && <div className="text-xs opacity-75">{ep.title}</div>}
          </button>
        ))}
      </div>
    </div>
  )
}