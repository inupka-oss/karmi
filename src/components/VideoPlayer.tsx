'use client'
import { useEffect, useRef, useCallback, useState } from 'react'
import Hls from 'hls.js'

function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/sb-access-token=([^;]+)/)
  return match ? match[1] : null
}

async function saveProgressToCloud(episodeId: string, time: number) {
  const token = getAccessToken()
  if (!token) return
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
    })
    if (!userRes.ok) return
    const user = await userRes.json()
    await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_identifier=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ progress: { episodeId, time } }),
    })
  } catch (e) {
    console.error('Save progress error:', e)
  }
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

interface Bookmark { time: number; label: string }

export default function VideoPlayer({
  src, title, onEnded, activeEpisodeId, openingStart, openingEnd, endingStart, endingEnd,
}: {
  src: string
  title: string
  onEnded?: () => void
  activeEpisodeId?: string
  openingStart?: number
  openingEnd?: number
  endingStart?: number
  endingEnd?: number
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const nextEpisodeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartXRef = useRef(0)
  const touchStartYRef = useRef(0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [buffered, setBuffered] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [autoPlayNext, setAutoPlayNext] = useState(true)
  const [nextCountdown, setNextCountdown] = useState<number | null>(null)
  const [isBuffering, setIsBuffering] = useState(false)

  // Загрузка закладок
  useEffect(() => {
    if (!activeEpisodeId) return
    const stored = localStorage.getItem(`bookmarks-${activeEpisodeId}`)
    if (stored) {
      try { setBookmarks(JSON.parse(stored)) } catch {}
    }
  }, [activeEpisodeId])

  const saveBookmarks = useCallback((newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks)
    if (activeEpisodeId) localStorage.setItem(`bookmarks-${activeEpisodeId}`, JSON.stringify(newBookmarks))
  }, [activeEpisodeId])

  const addBookmark = useCallback((time: number, label: string) => {
    saveBookmarks([...bookmarks, { time, label }])
  }, [bookmarks, saveBookmarks])

  const toggleBookmarkAtCurrent = useCallback(() => {
    const label = prompt('Название закладки:', `Момент @ ${formatTime(currentTime)}`)
    if (label) addBookmark(currentTime, label)
  }, [currentTime, addBookmark])

  const goToBookmark = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      if (!isPlaying) videoRef.current.play()
    }
    setShowBookmarks(false)
  }, [isPlaying])

  const scheduleNextEpisode = useCallback(() => {
    if (!autoPlayNext || !onEnded) return
    setNextCountdown(10)
    nextEpisodeTimeoutRef.current = setTimeout(() => { onEnded() }, 10000)
  }, [autoPlayNext, onEnded])

  const cancelNextEpisode = useCallback(() => {
    if (nextEpisodeTimeoutRef.current) {
      clearTimeout(nextEpisodeTimeoutRef.current)
      nextEpisodeTimeoutRef.current = null
    }
    setNextCountdown(null)
  }, [])

  useEffect(() => {
    return () => {
      if (nextEpisodeTimeoutRef.current) clearTimeout(nextEpisodeTimeoutRef.current)
    }
  }, [])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.paused ? video.play() : video.pause()
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  const setVolumeLevel = useCallback((newVolume: number) => {
    const video = videoRef.current
    if (!video) return
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }, [])

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(time, duration))
  }, [duration])

  const skipTo = useCallback((time: number) => {
    const video = videoRef.current
    if (video) video.currentTime = time
  }, [])

  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = rate
    setPlaybackRate(rate)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true))
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false))
    }
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
    touchStartYRef.current = e.touches[0].clientY
    setShowControls(true)
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const deltaX = touchEndX - touchStartXRef.current
    const deltaY = touchEndY - touchStartYRef.current
    const video = videoRef.current
    if (!video) return
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      seekTo(video.currentTime + (deltaX > 0 ? 10 : -10))
    }
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
      setVolumeLevel(Math.max(0, Math.min(1, volume + (deltaY > 0 ? -0.1 : 0.1))))
    }
  }, [seekTo, volume, setVolumeLevel])

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => { if (isPlaying) setShowControls(false) }, 3000)
  }, [isPlaying])

  // Инициализация видео
  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return
    setError(null)
    setIsLoading(true)
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }

    const isHls = src.endsWith('.m3u8')
    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 })
      hls.loadSource(src)
      hls.attachMedia(video)
      hlsRef.current = hls
      hls.on(Hls.Events.MANIFEST_PARSED, () => setIsLoading(false))
      hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) { setError('Ошибка загрузки видео'); setIsLoading(false) } })
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      video.addEventListener('loadedmetadata', () => setIsLoading(false))
    } else {
      video.src = src
      video.addEventListener('loadedmetadata', () => setIsLoading(false))
    }

    const onPlay = () => {
      setIsPlaying(true)
      setIsBuffering(false)
      progressIntervalRef.current = setInterval(() => {
        if (activeEpisodeId && video) {
          setCurrentTime(video.currentTime)
          setDuration(video.duration || 0)
          saveProgressToCloud(activeEpisodeId, video.currentTime)
          localStorage.setItem('karmi-progress', JSON.stringify({ episodeId: activeEpisodeId, time: video.currentTime }))
        }
      }, 5000)
    }
    const onPause = () => {
      setIsPlaying(false)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (activeEpisodeId && video) {
        saveProgressToCloud(activeEpisodeId, video.currentTime)
        localStorage.setItem('karmi-progress', JSON.stringify({ episodeId: activeEpisodeId, time: video.currentTime }))
      }
    }
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      setDuration(video.duration || 0)
      if (video.buffered.length > 0) setBuffered(video.buffered.end(video.buffered.length - 1))
    }
    const onWaiting = () => setIsBuffering(true)
    const onPlaying = () => setIsBuffering(false)
    const onEndedHandler = () => { scheduleNextEpisode(); if (onEnded) onEnded() }
    const onError = () => { setError('Ошибка воспроизведения видео'); setIsLoading(false); setIsBuffering(false) }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onPlaying)
    video.addEventListener('ended', onEndedHandler)
    video.addEventListener('error', onError)

    const restoreProgress = async () => {
      const stored = localStorage.getItem('karmi-progress')
      if (stored && activeEpisodeId) {
        try {
          const progress = JSON.parse(stored)
          if (progress.episodeId === activeEpisodeId && progress.time && progress.time < (video.duration || 0) - 10) {
            video.currentTime = progress.time
          }
        } catch {}
      } else if (getAccessToken() && activeEpisodeId) {
        try {
          const token = getAccessToken()
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` } })
          if (userRes.ok) {
            const user = await userRes.json()
            const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_identifier=eq.${user.id}`, { headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` } })
            if (res.ok) {
              const data = await res.json()
              if (data.length > 0 && data[0].progress?.episodeId === activeEpisodeId) video.currentTime = data[0].progress.time
            }
          }
        } catch {}
      }
    }
    restoreProgress()

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('ended', onEndedHandler)
      video.removeEventListener('error', onError)
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    }
  }, [src, activeEpisodeId, scheduleNextEpisode, onEnded, seekTo])

  useEffect(() => {
    if (nextCountdown === null || nextCountdown === 0) return
    const interval = setInterval(() => {
      setNextCountdown(prev => { if (prev === null || prev <= 1) { clearInterval(interval); return 0 } return prev - 1 })
    }, 1000)
    return () => clearInterval(interval)
  }, [nextCountdown])

  const skipOpening = useCallback(() => skipTo(openingEnd || 0), [openingEnd, skipTo])
  const skipToEnding = useCallback(() => skipTo(endingStart || 0), [endingStart, skipTo])

  return (
    <div className="relative" ref={containerRef}>
      <div className="video-shell aspect-video rounded-xl overflow-hidden bg-black mb-6 relative group" ref={containerRef} onClick={togglePlay} onMouseMove={handleMouseMove} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onMouseLeave={() => { if (isPlaying) setShowControls(false) }}>
        <video ref={videoRef} playsInline preload="auto" style={{ width: '100%', height: '100%', objectFit: 'contain' }} className="video-player-native cursor-pointer" />
        
        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"><div className="w-12 h-12 border-4 border-neo-pink border-t-transparent rounded-full animate-spin" /></div>}
        {isBuffering && <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20"><div className="w-10 h-10 border-4 border-neo-pink border-t-transparent rounded-full animate-spin" /></div>}
        {error && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20 text-white"><div className="text-5xl mb-4">⚠️</div><p className="text-lg mb-4">{error}</p><button onClick={() => { videoRef.current?.load(); setError(null) }} className="px-4 py-2 bg-neo-pink rounded-lg hover:bg-neo-red transition">Повторить</button></div>}
        
        {openingEnd && currentTime >= openingStart && currentTime < openingEnd && <button onClick={(e) => { e.stopPropagation(); skipOpening() }} className="absolute bottom-20 left-4 bg-neo-pink/90 hover:bg-neo-pink text-white px-4 py-2 rounded-lg text-sm font-semibold backdrop-blur-sm transition z-10">⏭ Пропустить опенинг</button>}
        {endingStart && currentTime >= endingStart - 30 && currentTime < endingStart && <button onClick={(e) => { e.stopPropagation(); skipToEnding() }} className="absolute bottom-20 right-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold backdrop-blur-sm transition z-10">⏭ К эндингу</button>}
        
        {nextCountdown !== null && nextCountdown > 0 && <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg z-30 flex items-center gap-3"><span className="text-sm">След. серия через {nextCountdown}s</span><button onClick={(e) => { e.stopPropagation(); cancelNextEpisode() }} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded">Отмена</button></div>}

        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 transition-opacity duration-300 z-30 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group/timeline" onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); seekTo((e.clientX - rect.left) / rect.width * duration) }}>
            <div className="absolute top-0 left-0 h-full bg-white/30 rounded-full" style={{ width: `${(buffered / duration) * 100}%` }} />
            <div className="absolute top-0 left-0 h-full bg-neo-pink rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={(e) => { e.stopPropagation(); togglePlay() }} className="text-white hover:text-neo-pink transition text-xl">{isPlaying ? '⏸' : '▶'}</button>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); toggleMute() }} className="text-white hover:text-neo-pink transition">{isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</button>
                <input type="range" min="0" max="1" step="0.1" value={isMuted ? 0 : volume} onChange={(e) => { e.stopPropagation(); setVolumeLevel(parseFloat(e.target.value)) }} className="w-20 accent-neo-pink" onClick={(e) => e.stopPropagation()} />
              </div>
              <span className="text-white text-sm font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>

            <div className="flex items-center gap-3">
              {bookmarks.length > 0 && <div className="relative"><button onClick={(e) => { e.stopPropagation(); setShowBookmarks(!showBookmarks) }} className="text-white hover:text-neo-pink transition">🔖</button>{showBookmarks && <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur rounded-lg p-3 min-w-[200px] max-h-48 overflow-y-auto z-40">{bookmarks.map((bm, idx) => <div key={idx} onClick={(e) => { e.stopPropagation(); goToBookmark(bm.time) }} className="text-white text-sm py-1 px-2 hover:bg-neo-pink/50 rounded cursor-pointer flex justify-between items-center"><span>{bm.label}</span><span className="text-xs text-gray-400">{formatTime(bm.time)}</span></div>)}</div>}</div>}
              <button onClick={(e) => { e.stopPropagation(); toggleBookmarkAtCurrent() }} className="text-white hover:text-neo-pink transition text-sm" title="Добавить закладку">+📑</button>
              <button onClick={(e) => { e.stopPropagation(); changePlaybackRate(playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : playbackRate === 1.5 ? 2 : 1) }} className="text-white hover:text-neo-pink transition text-sm font-mono w-10">{playbackRate}x</button>
              <button onClick={(e) => { e.stopPropagation(); setAutoPlayNext(!autoPlayNext) }} className={`text-sm transition ${autoPlayNext ? 'text-neo-pink' : 'text-gray-400'}`} title="Автопереключение">{autoPlayNext ? '🔄 Вкл' : '🔄 Выкл'}</button>
              <button onClick={(e) => { e.stopPropagation(); toggleFullscreen() }} className="text-white hover:text-neo-pink transition">⛶</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
