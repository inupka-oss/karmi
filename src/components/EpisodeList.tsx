'use client'
import { useState, useEffect, useRef } from 'react'
import VideoPlayer from './VideoPlayer'

interface Episode {
  id: string
  episode_number: number
  title?: string
  video_url: string
}

export default function EpisodeList({
  episodes,
  activeEpisode,
  onSelectEpisode,
}: {
  episodes: Episode[]
  activeEpisode?: Episode
  onSelectEpisode?: (ep: Episode) => void
}) {
  const [activeEp, setActiveEp] = useState<Episode | null>(activeEpisode || episodes?.[0] || null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Синхронизация с внешним activeEpisode (например, при нажатии "Продолжить")
  useEffect(() => {
    if (activeEpisode) setActiveEp(activeEpisode)
  }, [activeEpisode])

  // Сохранение прогресса каждые 5 секунд
  useEffect(() => {
    const video = document.querySelector('video')
    if (!video || !activeEp) return
    const interval = setInterval(() => {
      if (!video.paused) {
        localStorage.setItem(
          'karmi-progress',
          JSON.stringify({ episodeId: activeEp.id, time: video.currentTime })
        )
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [activeEp])

  // Автовоспроизведение следующей серии (только для <video>)
  const handleVideoEnded = () => {
    const currentIndex = episodes.findIndex(ep => ep.id === activeEp?.id)
    if (currentIndex < episodes.length - 1) {
      const nextEp = episodes[currentIndex + 1]
      setActiveEp(nextEp)
      onSelectEpisode?.(nextEp)
    }
  }

  if (!episodes || episodes.length === 0) {
    return <p className="text-gray-400 mt-10">Эпизоды пока не добавлены.</p>
  }

  return (
    <div className="mt-10">
      <VideoPlayer src={activeEp?.video_url || ''} title={activeEp?.title || `Эпизод ${activeEp?.episode_number}`} onEnded={handleVideoEnded} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
        {episodes.map((ep) => (
          <button
            key={ep.id}
            onClick={() => {
              setActiveEp(ep)
              onSelectEpisode?.(ep)
            }}
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