'use client'
import { useState } from 'react'
import VideoPlayer from './VideoPlayer'

interface Episode {
  id: string
  episode_number: number
  title?: string
  video_url: string
}

export default function EpisodeList({ episodes }: { episodes: Episode[] }) {
  const [activeEp, setActiveEp] = useState<Episode | null>(episodes?.[0] || null)

  if (!episodes || episodes.length === 0) {
    return <p className="text-gray-400 mt-10">Эпизоды пока не добавлены.</p>
  }

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