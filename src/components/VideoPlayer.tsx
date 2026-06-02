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
  const [autoPlayNext, setAutoPlayNext] = useState(true)
  const [nextCountdown, setNextCountdown] = useState<number | null>(null)
  const [isBuffering, setIsBuffering] = useState(false)
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false)
  const [qualities, setQualities] = useState<{ label: string; height: number }[]>([])
  const [currentQualityIdx, setCurrentQualityIdx] = useState(0)

  // Инициализация качества для HLS
  useEffect(() => {
    if (src.endsWith('.m3u8') && hlsRef.current) {
      const hls = hlsRef.current
      const levels = hls.levels || []
      if (levels.length > 0) {
        setQualities(levels.map(l => ({ label: `${l.height}p`, height: l.height })))
      }
    }
  }, [src])

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

  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    const video = videoRef.current
    if (!video) return
    video.paused ? video.play() : video.pause()
  }, [])

  const toggleMute = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  const setVolumeLevel = useCallback((newVolume: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const video = videoRef.current
    if (!video) return
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }, [])

  const seekTo = useCallback((time: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(time, duration))
  }, [duration])

  const skipTo = useCallback((time: number) => {
    const video = videoRef.current
    if (video) video.currentTime = time
  }, [])

  const changePlaybackRate = useCallback((rate: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const video = videoRef.current
    if (!video) return
    video.playbackRate = rate
    setPlaybackRate(rate)
  }, [])

  const toggleFullscreen = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    const container = containerRef.current
    if (!container) return
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error('Fullscreen error:', err)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(err => {
        console.error('ExitFullscreen error:', err)
      })
      setIsFullscreen(false)
    }
  }, [])

  // Обработка fullscreenchange
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

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
  }, [src, activeEpisodeId, scheduleNextEpisode, onEnded])

  useEffect(() => {
    if (nextCountdown === null || nextCountdown === 0) return
    const interval = setInterval(() => {
      setNextCountdown(prev => { if (prev === null || prev <= 1) { clearInterval(interval); return 0 } return prev - 1 })
    }, 1000)
    return () => clearInterval(interval)
  }, [nextCountdown])

  const skipOpening = useCallback(() => skipTo(openingEnd || 0), [openingEnd, skipTo])
  const skipToEnding = useCallback(() => skipTo(endingStart || 0), [endingStart, skipTo])

  // Переключение качества
  const changeQuality = useCallback((idx: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrentQualityIdx(idx)
    setQualityMenuOpen(false)
    if (src.endsWith('.m3u8') && hlsRef.current && qualities[idx]) {
      hlsRef.current.currentLevel = idx
      hlsRef.current.nextLevel = idx
    }
  }, [src, qualities])

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className="video-shell aspect-video rounded-xl overflow-hidden bg-black mb-6 relative" 
        ref={containerRef}
        onClick={togglePlay}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { if (isPlaying) setShowControls(false) }}
      >
        <video 
          ref={videoRef} 
          playsInline 
          preload="auto" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          className="video-player-native cursor-pointer" 
        />
        
        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"><div className="w-12 h-12 border-4 border-neo-pink border-t-transparent rounded-full animate-spin" /></div>}
        {isBuffering && <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20"><div className="w-10 h-10 border-4 border-neo-pink border-t-transparent rounded-full animate-spin" /></div>}
        {error && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20 text-white"><div className="text-5xl mb-4">!</div><p className="text-lg mb-4">{error}</p><button onClick={(e) => { e.stopPropagation(); videoRef.current?.load(); setError(null) }} className="px-4 py-2 bg-neo-pink rounded-lg hover:bg-neo-red transition">Повторить</button></div>}
        
        {openingEnd && currentTime >= openingStart && currentTime < openingEnd && <button onClick={(e) => { e.stopPropagation(); skipOpening() }} className="absolute bottom-24 left-4 bg-neo-pink/90 hover:bg-neo-pink text-white px-4 py-2 rounded-lg text-sm font-semibold backdrop-blur-sm transition z-10">Пропустить опенинг</button>}
        {endingStart && currentTime >= endingStart - 30 && currentTime < endingStart && <button onClick={(e) => { e.stopPropagation(); skipToEnding() }} className="absolute bottom-24 right-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-semibold backdrop-blur-sm transition z-10">К эндингу</button>}
        
        {nextCountdown !== null && nextCountdown > 0 && <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg z-30 flex items-center gap-3"><span className="text-sm">След. серия через {nextCountdown}s</span><button onClick={(e) => { e.stopPropagation(); cancelNextEpisode() }} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded">Отмена</button></div>}

        {/* Кастомные контролы */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-opacity duration-300 z-30 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
          {/* Прогресс-бар */}
          <div className="relative h-1 bg-white/20 rounded-full cursor-pointer mb-3" onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); seekTo((e.clientX - rect.left) / rect.width * duration) }}>
            <div className="absolute top-0 left-0 h-full bg-white/30 rounded-full" style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }} />
            <div className="absolute top-0 left-0 h-full bg-neo-pink rounded-full" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <button onClick={togglePlay} className="text-white hover:text-neo-pink transition text-xl sm:text-2xl" style={{ WebkitTapHighlightColor: 'transparent' }}>{isPlaying ? '❚❚' : '▶'}</button>
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-white hover:text-neo-pink transition" style={{ WebkitTapHighlightColor: 'transparent' }}>{isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</button>
                <input type="range" min="0" max="1" step="0.1" value={isMuted ? 0 : volume} onChange={(e) => setVolumeLevel(parseFloat(e.target.value))} className="w-16 sm:w-24 accent-neo-pink" style={{ WebkitTapHighlightColor: 'transparent' }} />
              </div>
              <span className="text-white text-xs sm:text-sm font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Качество */}
              {qualities.length > 0 && (
                <div className="relative">
                  <button onClick={() => setQualityMenuOpen(!qualityMenuOpen)} className="text-white hover:text-neo-pink transition text-xs sm:text-sm font-bold w-10" style={{ WebkitTapHighlightColor: 'transparent' }}>{qualities[currentQualityIdx]?.label || 'HD'}</button>
                  {qualityMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur rounded-lg p-2 z-40 min-w-[100px]">
                      {qualities.map((q, idx) => (
                        <button 
                          key={idx} 
                          onClick={(e) => changeQuality(idx, e)}
                          className={`block w-full text-left text-xs sm:text-sm py-1 px-3 rounded ${currentQualityIdx === idx ? 'bg-neo-pink text-white' : 'text-white hover:bg-white/10'}`}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <button onClick={(e) => changePlaybackRate(playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : playbackRate === 1.5 ? 2 : 1)} className="text-white hover:text-neo-pink transition text-xs sm:text-sm font-mono w-10" style={{ WebkitTapHighlightColor: 'transparent' }}>{playbackRate}x</button>
              <button onClick={(e) => { e.stopPropagation(); setAutoPlayNext(!autoPlayNext) }} className={`text-xs sm:text-sm transition ${autoPlayNext ? 'text-neo-pink' : 'text-gray-400'}`} style={{ WebkitTapHighlightColor: 'transparent' }}>{autoPlayNext ? 'AUTO' : 'OFF'}</button>
              <button onClick={toggleFullscreen} className="text-white hover:text-neo-pink transition text-lg sm:text-xl" style={{ WebkitTapHighlightColor: 'transparent' }}>{isFullscreen ? '⤢' : '⤢'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}