'use client'
import { useEffect, useRef, useCallback } from 'react'
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'
import Hls from 'hls.js'

function getAccessToken(): string | null {
  const match = document.cookie.match(/sb-access-token=([^;]+)/)
  return match ? match[1] : null
}

async function saveProgressToCloud(episodeId: string, time: number) {
  // ... без изменений
}

export default function VideoPlayer({
  src,
  title,
  onEnded,
  activeEpisodeId,
  openingStart,
  openingEnd,
  endingStart,
  endingEnd,
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
  const playerRef = useRef<Plyr | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const skipTo = useCallback((time: number) => {
    const video = videoRef.current
    if (video) {
      video.currentTime = time
    }
  }, [])

  const initPlayer = useCallback(() => {
    const video = videoRef.current
    if (!video || !src) return

    if (playerRef.current) {
      playerRef.current.destroy()
      playerRef.current = null
    }
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    // Определяем тип источника
    if (src.endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(src)
        hls.attachMedia(video)
        hlsRef.current = hls
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src
      }
    } else {
      // Прямая ссылка на mp4 или другой формат
      video.src = src
    }

    if (title) {
      video.setAttribute('data-plyr-title', title)
    }

    const player = new Plyr(video, {
      controls: [
        'play-large', 'play', 'progress', 'current-time', 'mute', 'volume',
        'captions', 'settings', 'pip', 'airplay', 'fullscreen'
      ],
      settings: ['speed', 'quality', 'captions'],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      keyboard: { focused: true, global: true },
      tooltips: { controls: true, seek: true },
      captions: { active: true, language: 'auto', update: true },
    })

    playerRef.current = player

    player.on('ended', () => {
      if (onEnded) onEnded()
    })

    // ... остальная логика сохранения прогресса без изменений
  }, [src, title, onEnded, activeEpisodeId, openingStart, openingEnd, endingStart, endingEnd])

  useEffect(() => {
    const cleanup = initPlayer()
    return () => {
      if (playerRef.current) playerRef.current.destroy()
      if (hlsRef.current) hlsRef.current.destroy()
      if (cleanup) cleanup()
    }
  }, [initPlayer])

  return (
    <div className="relative" ref={containerRef}>
      <div className="aspect-video rounded-xl overflow-hidden glass mb-6">
        <video ref={videoRef} className="w-full h-full" playsInline crossOrigin="anonymous" />
      </div>
      {/* Кнопки пропуска опенинга / эндинга остаются */}
    </div>
  )
}