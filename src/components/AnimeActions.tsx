'use client'

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
  const lastWatchedEpisode = progress
    ? episodes.find(ep => ep.id === progress.episodeId)
    : null

  return (
    <div className="flex flex-col gap-2 mt-3">
      {trailerUrl && (
        <a
          href={trailerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-neo-pink/20 hover:bg-neo-pink/40 text-neo-pink px-4 py-2 rounded-xl border border-neo-pink/50 font-semibold text-center text-sm transition"
        >
          Смотреть трейлер
        </a>
      )}
      {episodes.length > 0 && (
        <>
          <button
            onClick={() => onStartWatching(episodes[0])}
            className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-xl font-semibold text-center text-sm transition"
          >
            Начать с 1 серии
          </button>
          {lastWatchedEpisode && (
            <button
              onClick={() => onContinueWatching(lastWatchedEpisode)}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-semibold text-center text-sm transition"
            >
              Продолжить (серия {lastWatchedEpisode.episode_number})
            </button>
          )}
        </>
      )}
    </div>
  )
}