'use client'
import { useState, useEffect } from 'react'
import VideoPlayer from './VideoPlayer'

interface Episode {
  id: string
  episode_number: number
  title?: string
  video_url: string
  opening_start?: number
  opening_end?: number
  ending_start?: number
  ending_end?: number
}

export default function EpisodeList({
  episodes,
  activeEpisode,
  onSelectEpisode,
  activeEpisodeId,
}: {
  episodes: Episode[]
  activeEpisode?: Episode
  onSelectEpisode?: (ep: Episode) => void
  activeEpisodeId?: string
}) {
  const [activeEp, setActiveEp] = useState<Episode | null>(activeEpisode || episodes?.[0] || null)

  useEffect(() => {
    if (activeEpisode) setActiveEp(activeEpisode)
  }, [activeEpisode])

  const handleSelect = (ep: Episode) => {
    setActiveEp(ep)
    onSelectEpisode?.(ep)
  }

  const handleEnded = () => {
    const currentIndex = episodes.findIndex(ep => ep.id === activeEp?.id)
    if (currentIndex < episodes.length - 1) {
      const nextEp = episodes[currentIndex + 1]
      handleSelect(nextEp)
    }
  }

  if (!episodes || episodes.length === 0) {
    return <p className="text-gray-400 mt-10">Эпизоды пока не добавлены.</p>
  }

  return (
    <div className="mt-10">
      <VideoPlayer
        src={activeEp?.video_url || ''}
        title={activeEp?.title || `Эпизод ${activeEp?.episode_number}`}
        onEnded={handleEnded}
        activeEpisodeId={activeEp?.id || activeEpisodeId}
        openingStart={activeEp?.opening_start}
        openingEnd={activeEp?.opening_end}
        endingStart={activeEp?.ending_start}
        endingEnd={activeEp?.ending_end}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
        {episodes.map(ep => (
          <button
            key={ep.id}
            onClick={() => handleSelect(ep)}
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