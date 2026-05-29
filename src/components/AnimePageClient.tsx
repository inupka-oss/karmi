'use client'
import { useState, useEffect } from 'react'
import AnimeActions from './AnimeActions'
import EpisodeList from './EpisodeList'

interface Episode {
  id: string
  episode_number: number
  title?: string
  video_url: string
}

export default function AnimePageClient({
  trailerUrl,
  episodes,
}: {
  trailerUrl?: string
  episodes: Episode[]
}) {
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null)
  const [progress, setProgress] = useState<{ episodeId: string; time: number } | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('karmi-progress')
    if (stored) {
      try {
        setProgress(JSON.parse(stored))
      } catch {}
    }
  }, [])

  const handleStartWatching = (ep: Episode) => {
    setActiveEpisode(ep)
  }

  const handleContinueWatching = (ep: Episode) => {
    setActiveEpisode(ep)
  }

  return (
    <>
      <AnimeActions
        trailerUrl={trailerUrl}
        episodes={episodes}
        onStartWatching={handleStartWatching}
        onContinueWatching={handleContinueWatching}
        progress={progress}
      />
      <EpisodeList
        episodes={episodes}
        activeEpisode={activeEpisode || episodes[0] || null}
        onSelectEpisode={setActiveEpisode}
      />
    </>
  )
}