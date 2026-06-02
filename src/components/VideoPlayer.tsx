'use client'
import { useEffect, useRef, useCallback } from 'react'
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
    const userId = user.id

    await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_identifier=eq.${userId}`, {
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
  const hlsRef = useRef<Hls | null>(null)

  const skipTo = useCallback((time: number) => {
    const video = videoRef.current
    if (video) video.currentTime = time
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    // Уничтожаем предыдущий HLS
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const isHls = src.endsWith('.m3u8')

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(src)
        hls.attachMedia(video)
        hlsRef.current = hls
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src
      }
    } else {
      // Для обычных видео (Storj, Supabase)
      video.src = src
      video.setAttribute('preload', 'auto')
    }

    if (title) {
      video.setAttribute('data-title', title)
    }

    // ВРЕМЕННАЯ ДИАГНОСТИКА
    const onError = () => {
      const err = video.error
      console.error('[VideoPlayer] video error:', {
        code: err?.code,
        message: err?.message,
        src: video.currentSrc || video.src,
        networkState: video.networkState,
        readyState: video.readyState,
      })
    }
    const onLoadedMeta = () => {
      console.log('[VideoPlayer] loadedmetadata OK:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        duration: video.duration,
      })
    }
    const onCanPlay = () => console.log('[VideoPlayer] canplay — видео декодируется')
    video.addEventListener('error', onError)
    video.addEventListener('loadedmetadata', onLoadedMeta)
    video.addEventListener('canplay', onCanPlay)

    video.onended = () => {
      if (onEnded) onEnded()
    }

    let saveInterval: NodeJS.Timeout | null = null
    video.onplay = () => {
      saveInterval = setInterval(() => {
        if (activeEpisodeId && video) {
          saveProgressToCloud(activeEpisodeId, video.currentTime)
          localStorage.setItem('karmi-progress', JSON.stringify({
            episodeId: activeEpisodeId,
            time: video.currentTime,
          }))
        }
      }, 10000)
    }

    video.onpause = () => {
      if (saveInterval) clearInterval(saveInterval)
      if (activeEpisodeId && video) {
        saveProgressToCloud(activeEpisodeId, video.currentTime)
        localStorage.setItem('karmi-progress', JSON.stringify({
          episodeId: activeEpisodeId,
          time: video.currentTime,
        }))
      }
    }

    // Восстановление времени
    const stored = localStorage.getItem('karmi-progress')
    if (stored && activeEpisodeId) {
      try {
        const progress = JSON.parse(stored)
        if (progress.episodeId === activeEpisodeId && progress.time) {
          video.currentTime = progress.time
          localStorage.removeItem('karmi-progress')
        }
      } catch {}
    } else if (getAccessToken() && activeEpisodeId) {
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
              if (cloudProgress.episodeId === activeEpisodeId && cloudProgress.time && video) {
                video.currentTime = cloudProgress.time
              }
            }
          }
        } catch {}
      }
      loadCloudProgress()
    }

    return () => {
      if (saveInterval) clearInterval(saveInterval)
      video.removeEventListener('error', onError)
      video.removeEventListener('loadedmetadata', onLoadedMeta)
      video.removeEventListener('canplay', onCanPlay)
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [src, title, onEnded, activeEpisodeId, openingStart, openingEnd, endingStart, endingEnd])

  return (
    <div className="relative">
      <div className="video-shell aspect-video rounded-xl overflow-hidden bg-black mb-6">
        <video
          ref={videoRef}
          playsInline
          preload="auto"
          controls
          style={{ width: '100%', height: '100%' }}
          className="video-player-native"
        />
      </div>
      {openingEnd && (
        <button
          onClick={() => skipTo(openingEnd)}
          className="absolute bottom-8 left-4 bg-neo-pink/80 hover:bg-neo-pink text-white px-3 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm"
        >
          Пропустить опенинг
        </button>
      )}
      {endingStart && (
        <button
          onClick={() => skipTo(endingStart)}
          className="absolute bottom-8 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm"
        >
          К эндингу
        </button>
      )}
    </div>
  )
}