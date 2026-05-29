'use client'
import { useEffect, useRef, useCallback } from 'react'
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'
import Hls from 'hls.js'

export default function VideoPlayer({ src, title, onEnded }: { src: string; title: string; onEnded?: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const playerRef = useRef<Plyr | null>(null)
  const hlsRef = useRef<Hls | null>(null)

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
      video.src = src
    }

    // Устанавливаем заголовок через data-атрибут
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

    try {
      const stored = localStorage.getItem('karmi-progress')
      if (stored) {
        const progress = JSON.parse(stored)
        if (progress.time && video) {
          video.currentTime = progress.time
          localStorage.removeItem('karmi-progress')
        }
      }
    } catch {}
  }, [src, title, onEnded])

  useEffect(() => {
    initPlayer()
    return () => {
      if (playerRef.current) playerRef.current.destroy()
      if (hlsRef.current) hlsRef.current.destroy()
    }
  }, [initPlayer])

  return (
    <div className="aspect-video rounded-xl overflow-hidden glass mb-6">
      <video ref={videoRef} className="w-full h-full" playsInline crossOrigin="anonymous" />
    </div>
  )
}