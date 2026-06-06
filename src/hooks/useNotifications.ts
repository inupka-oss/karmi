'use client'
import { useState, useEffect, useCallback } from 'react'
import { getAccessToken } from '@/lib/auth'
import type { Notification } from '@/types/user'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadNotifications = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/notifications?select=*&is_read=eq.false&order=created_at.desc`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
        setUnreadCount(data.length)
      }
    } catch {
      console.error('Load notifications error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const clearNotifications = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    try {
      await fetch(`${supabaseUrl}/rest/v1/notifications?is_read=eq.false`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      })
      setNotifications([])
      setUnreadCount(0)
    } catch {
      console.error('Clear notifications error')
    }
  }, [])

  return { notifications, newEpisodes: notifications, clearNotifications, unreadCount, isLoading }
}
