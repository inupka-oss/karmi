'use client'
import { useState, useEffect, useCallback } from 'react'

function getAccessToken(): string | null {
  const match = document.cookie.match(/sb-access-token=([^;]+)/)
  return match ? match[1] : null
}

function getGuestId() {
  let id = localStorage.getItem('karmi-guest-id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('karmi-guest-id', id)
  }
  return id
}

export function useNotifications() {
  const [subscriptions, setSubscriptions] = useState<string[]>([])
  const [newEpisodes, setNewEpisodes] = useState<{ animeId: string; title: string }[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Загружаем подписки
  const loadSubscriptions = useCallback(async () => {
    const token = getAccessToken()
    let userId: string

    if (token) {
      try {
        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
        })
        if (!userRes.ok) return
        const user = await userRes.json()
        userId = user.id
      } catch { return }
    } else {
      userId = getGuestId()
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/subscriptions?user_identifier=eq.${userId}&select=anime_id`, {
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token || ''}` },
    })
    if (res.ok) {
      const data: { anime_id: string }[] = await res.json()
      setSubscriptions(data.map(s => s.anime_id))
    }
  }, [supabaseUrl, supabaseAnonKey])

  // Проверяем новые серии
  const checkNewEpisodes = useCallback(async () => {
    const token = getAccessToken()
    let userId: string
    if (token) {
      try {
        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
        })
        if (!userRes.ok) return
        const user = await userRes.json()
        userId = user.id
      } catch { return }
    } else {
      userId = getGuestId()
    }

    const lastCheck = localStorage.getItem('karmi-last-check') || new Date(0).toISOString()
    const res = await fetch(`${supabaseUrl}/rest/v1/episodes?created_at=gt.${lastCheck}&select=anime_id,anime!inner(title_ru)`, {
      headers: { 'apikey': supabaseAnonKey },
    })
    if (res.ok) {
      const episodes = await res.json()
      const userSubs = subscriptions
      const newNotifs = episodes
        .filter((ep: any) => userSubs.includes(ep.anime_id))
        .map((ep: any) => ({ animeId: ep.anime_id, title: ep.anime?.title_ru || 'Без названия' }))
      if (newNotifs.length > 0) {
        setNewEpisodes(newNotifs)
      }
    }
    localStorage.setItem('karmi-last-check', new Date().toISOString())
  }, [supabaseUrl, supabaseAnonKey, subscriptions])

  const toggleSubscription = useCallback(async (animeId: string) => {
    const token = getAccessToken()
    let userId: string
    if (token) {
      try {
        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
        })
        if (!userRes.ok) return
        const user = await userRes.json()
        userId = user.id
      } catch { return }
    } else {
      userId = getGuestId()
    }

    if (subscriptions.includes(animeId)) {
      await fetch(`${supabaseUrl}/rest/v1/subscriptions?user_identifier=eq.${userId}&anime_id=eq.${animeId}`, {
        method: 'DELETE',
        headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token || ''}` },
      })
      setSubscriptions(prev => prev.filter(id => id !== animeId))
    } else {
      await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ user_identifier: userId, anime_id: animeId }),
      })
      setSubscriptions(prev => [...prev, animeId])
    }
  }, [supabaseUrl, supabaseAnonKey, subscriptions])

  useEffect(() => {
    loadSubscriptions()
  }, [loadSubscriptions])

  useEffect(() => {
    if (subscriptions.length > 0) {
      checkNewEpisodes()
    }
  }, [subscriptions, checkNewEpisodes])

  // Загружаем количество непрочитанных уведомлений
  useEffect(() => {
    const loadUnreadCount = async () => {
      const token = getAccessToken()
      if (!token) return

      try {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/notifications?is_read=eq.false&select=id`,
          {
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${token}`,
            },
          }
        )
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.length)
        }
      } catch (e) {
        console.error('Load unread count error:', e)
      }
    }

    loadUnreadCount()
    // Проверяем каждые 30 секунд
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [supabaseUrl, supabaseAnonKey])

  return { 
    subscriptions, 
    newEpisodes, 
    toggleSubscription, 
    clearNotifications: () => setNewEpisodes([]),
    unreadCount,
  }
}