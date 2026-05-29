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
  const token = getAccessToken()
  if (!token) return

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  try {
    // Получаем user_id
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
    })
    if (!userRes.ok) return
    const user = await userRes.json()
    const userId = user.id

    // Обновляем прогресс в профиле
    await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        progress: { episodeId, time },
      }),
    })
  } catch {}
}

export default function VideoPlayer({
  src,
  title,
  onEnded,
  activeEpisodeId,
}: {
  src: string
  title: string
  onEnded?: () => void
  activeEpisodeId?: string
}) {
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

    // Событие окончания
    player.on('ended', () => {
      if (onEnded) onEnded()
    })

    // Сохранение прогресса каждые 10 секунд и при паузе
    let saveInterval: NodeJS.Timeout | null = null
    player.on('play', () => {
      saveInterval = setInterval(() => {
        if (activeEpisodeId && video) {
          saveProgressToCloud(activeEpisodeId, video.currentTime)
          // Также сохраняем в localStorage для гостей
          localStorage.setItem('karmi-progress', JSON.stringify({
            episodeId: activeEpisodeId,
            time: video.currentTime,
          }))
        }
      }, 10000)
    })

    player.on('pause', () => {
      if (saveInterval) clearInterval(saveInterval)
      if (activeEpisodeId && video) {
        saveProgressToCloud(activeEpisodeId, video.currentTime)
        localStorage.setItem('karmi-progress', JSON.stringify({
          episodeId: activeEpisodeId,
          time: video.currentTime,
        }))
      }
    })

    // Восстановление времени, если есть сохранённый прогресс для этого эпизода
    const stored = localStorage.getItem('karmi-progress')
    if (stored) {
      try {
        const progress = JSON.parse(stored)
        if (progress.episodeId === activeEpisodeId && progress.time && video) {
          video.currentTime = progress.time
          localStorage.removeItem('karmi-progress')
        }
      } catch {}
    } else if (getAccessToken() && activeEpisodeId) {
      // Загружаем прогресс из облака при первом воспроизведении
      const loadCloudProgress = async () => {
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
          const userId = user.id

          const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_identifier=eq.${userId}`, {
            headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json()
            if (data.length > 0 && data[0].progress) {
              const cloudProgress = data[0].progress
              if (cloudProgress.episodeId === activeEpisodeId && cloudProgress.time) {
                if (video) video.currentTime = cloudProgress.time
              }
            }
          }
        } catch {}
      }
      loadCloudProgress()
    }

    return () => {
      if (saveInterval) clearInterval(saveInterval)
    }
  }, [src, title, onEnded, activeEpisodeId])

  useEffect(() => {
    const cleanup = initPlayer()
    return () => {
      if (playerRef.current) playerRef.current.destroy()
      if (hlsRef.current) hlsRef.current.destroy()
      if (cleanup) cleanup()
    }
  }, [initPlayer])

  return (
    <div className="aspect-video rounded-xl overflow-hidden glass mb-6">
      <video ref={videoRef} className="w-full h-full" playsInline crossOrigin="anonymous" />
    </div>
  )
}