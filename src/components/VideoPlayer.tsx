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
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [buffered, setBuffered] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoPlayNext, setAutoPlayNext] = useState(true)
  const [nextCountdown, setNextCountdown] = useState<number | null>(null)
  const [isBuffering, setIsBuffering] = useState(false)
  const [qualities, setQualities] = useState<{ label: string; height: number }[]>([])
  const [currentQualityIdx, setCurrentQualityIdx] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showQualityMenu, setShowQualityMenu] = useState(false)

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
    setShowSpeedMenu(false)
    setMenuOpen(false)
  }, [])

  // Исправленный полноэкранный режим
  const toggleFullscreen = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    const container = containerRef.current
    if (!container) return
    
    // Останавливаем всплытие и предотвращаем клик по видео
    e?.preventDefault()
    
    const isFullscreen = !!document.fullscreenElement
    
    // Используем requestFullscreen с vendor prefixes
    const requestFullscreen = async () => {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen()
        } else if ((container as any).webkitRequestFullscreen) {
          ;(container as any).webkitRequestFullscreen()
        } else if ((container as any).msRequestFullscreen) {
          ;(container as any).msRequestFullscreen()
        }
      } catch (err) {
        console.error('Fullscreen error:', err)
      }
    }
    
    const exitFullscreen = async () => {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          ;(document as any).webkitExitFullscreen()
        } else if ((document as any).msExitFullscreen) {
          ;(document as any).msExitFullscreen()
        }
      } catch (err) {
        console.error('ExitFullscreen error:', err)
      }
    }
    
    if (isFullscreen) {
      exitFullscreen()
    } else {
      requestFullscreen()
    }
  }, [])

  // Слушатель fullscreenchange
  useEffect(() => {
    const onFsChange = () => {
      // Ничего не делаем, состояние не меняем
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
    setShowQualityMenu(false)
    setMenuOpen(false)
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
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 sm:p-4 transition-opacity duration-300 z-30 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
          {/* Прогресс-бар */}
          <div className="relative h-1 bg-white/20 rounded-full cursor-pointer mb-2 sm:mb-3" onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); seekTo((e.clientX - rect.left) / rect.width * duration) }}>
            <div className="absolute top-0 left-0 h-full bg-white/30 rounded-full" style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }} />
            <div className="absolute top-0 left-0 h-full bg-neo-pink rounded-full" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
          </div>

          <div className="flex items-center justify-between">
            {/* Левая часть: Play, громкость, время */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Play/Pause */}
              <button onClick={togglePlay} className="text-white hover:text-neo-pink transition p-1 sm:p-2" style={{ WebkitTapHighlightColor: 'transparent' }}>
                {isPlaying ? (
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                ) : (
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>
              
              {/* Громкость */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button onClick={toggleMute} className="text-white hover:text-neo-pink transition p-1" style={{ WebkitTapHighlightColor: 'transparent' }}>
                  {isMuted || volume === 0 ? (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                  ) : volume < 0.5 ? (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                  ) : (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                  )}
                </button>
                <input type="range" min="0" max="1" step="0.1" value={isMuted ? 0 : volume} onChange={(e) => setVolumeLevel(parseFloat(e.target.value))} className="w-16 sm:w-24 accent-neo-pink" style={{ WebkitTapHighlightColor: 'transparent' }} />
              </div>
              
              {/* Время */}
              <span className="text-white text-xs sm:text-sm font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>

            {/* Правая часть: Бургер-меню */}
            <div className="flex items-center">
              <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }} className="text-white hover:text-neo-pink transition p-2" style={{ WebkitTapHighlightColor: 'transparent' }}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/></svg>
              </button>
            </div>
          </div>

          {/* Бургер-меню */}
          {menuOpen && (
            <div className="absolute bottom-16 right-4 bg-black/95 backdrop-blur rounded-lg p-3 z-40 min-w-[180px]">
              {/* Полноэкранный режим */}
              <button onClick={toggleFullscreen} className="flex items-center gap-3 w-full text-left text-white hover:text-neo-pink py-2 px-3 rounded hover:bg-white/10 transition" style={{ WebkitTapHighlightColor: 'transparent' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                <span className="text-sm">На весь экран</span>
              </button>

              {/* Скорость воспроизведения */}
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false) }} className="flex items-center gap-3 w-full text-left text-white hover:text-neo-pink py-2 px-3 rounded hover:bg-white/10 transition" style={{ WebkitTapHighlightColor: 'transparent' }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                  <span className="text-sm">Скорость</span>
                  <span className="text-xs text-neo-pink font-mono ml-auto">{playbackRate}x</span>
                </button>
                {showSpeedMenu && (
                  <div className="absolute right-full top-0 bg-black/95 backdrop-blur rounded-lg p-2 z-50 min-w-[120px] mr-2">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                      <button 
                        key={rate} 
                        onClick={(e) => changePlaybackRate(rate, e)}
                        className={`block w-full text-left text-sm py-1 px-3 rounded ${playbackRate === rate ? 'bg-neo-pink text-white' : 'text-white hover:bg-white/10'}`}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Качество (для HLS) */}
              {qualities.length > 0 && (
                <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false) }} className="flex items-center gap-3 w-full text-left text-white hover:text-neo-pink py-2 px-3 rounded hover:bg-white/10 transition" style={{ WebkitTapHighlightColor: 'transparent' }}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                    <span className="text-sm">Качество</span>
                    <span className="text-xs text-neo-pink ml-auto">{qualities[currentQualityIdx]?.label}</span>
                  </button>
                  {showQualityMenu && (
                    <div className="absolute right-full top-0 bg-black/95 backdrop-blur rounded-lg p-2 z-50 min-w-[120px] mr-2">
                      {qualities.map((q, idx) => (
                        <button 
                          key={idx} 
                          onClick={(e) => changeQuality(idx, e)}
                          className={`block w-full text-left text-sm py-1 px-3 rounded ${currentQualityIdx === idx ? 'bg-neo-pink text-white' : 'text-white hover:bg-white/10'}`}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Автопереключение */}
              <button onClick={(e) => { e.stopPropagation(); setAutoPlayNext(!autoPlayNext); setMenuOpen(false) }} className={`flex items-center gap-3 w-full text-left py-2 px-3 rounded transition ${autoPlayNext ? 'text-neo-pink' : 'text-gray-400 hover:text-white'}`} style={{ WebkitTapHighlightColor: 'transparent' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
                <span className="text-sm">Автопереключение</span>
                <span className="text-xs ml-auto">{autoPlayNext ? 'ВКЛ' : 'ВЫКЛ'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}