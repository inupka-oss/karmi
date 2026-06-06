'use client'
import { useState } from 'react'
import WatchParty from './WatchParty'

interface Episode {
  id: string
  episode_number: number
  title?: string
  video_url: string
}

export default function AnimeActions({
  trailerUrl,
  episodes,
  onStartWatching,
  onContinueWatching,
  progress,
}: {
  trailerUrl?: string
  episodes: Episode[]
  onStartWatching: (ep: Episode) => void
  onContinueWatching: (ep: Episode) => void
  progress?: { episodeId: string; time: number } | null
}) {
  const [showWatchParty, setShowWatchParty] = useState(false)
  const lastWatchedEpisode = progress
    ? episodes.find(ep => ep.id === progress.episodeId)
    : null

  return (
    <>
      <div className="flex flex-col gap-2 mt-3">
        {trailerUrl && (
          <a
            href={trailerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-neo-purple/20 hover:bg-neo-purple/40 text-neo-purple-light px-4 py-2 rounded-xl border border-neo-purple/50 font-semibold text-center text-sm transition"
          >
            🎬 Смотреть трейлер
          </a>
        )}
        {episodes.length > 0 && (
          <>
            <button
              onClick={() => onStartWatching(episodes[0])}
              className="bg-neo-purple hover:bg-neo-purple-dark text-white px-4 py-2 rounded-xl font-semibold text-center text-sm transition shadow-neon hover:shadow-neon-hover"
            >
              ▶ Начать с 1 серии
            </button>
            {lastWatchedEpisode && (
              <button
                onClick={() => onContinueWatching(lastWatchedEpisode)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-semibold text-center text-sm transition"
              >
                ⏩ Продолжить (серия {lastWatchedEpisode.episode_number})
              </button>
            )}
            <button
              onClick={() => setShowWatchParty(true)}
              className="bg-neo-pink/20 hover:bg-neo-pink/40 text-neo-pink px-4 py-2 rounded-xl border border-neo-pink/50 font-semibold text-center text-sm transition"
            >
              🎉 Смотреть с друзьями
            </button>
          </>
        )}
      </div>

      {showWatchParty && episodes[0] && (
        <WatchParty
          episodeId={episodes[0].id}
          videoUrl={episodes[0].video_url}
          onClose={() => setShowWatchParty(false)}
        />
      )}
    </>
  )
}