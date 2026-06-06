'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: any
  is_read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const getAccessToken = () => {
    const match = document.cookie.match(/sb-access-token=([^;]+)/)
    return match ? match[1] : null
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    const token = getAccessToken()
    if (!token) return

    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/notifications?order=created_at.desc&limit=50`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
          },
        }
      )
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (e) {
      console.error('Load notifications error:', e)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    const token = getAccessToken()
    if (!token) return

    try {
      await fetch(`${supabaseUrl}/rest/v1/notifications?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (e) {
      console.error('Mark read error:', e)
    }
  }

  const markAllAsRead = async () => {
    const token = getAccessToken()
    if (!token) return

    try {
      await fetch(`${supabaseUrl}/rest/v1/notifications?is_read=eq.false`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (e) {
      console.error('Mark all read error:', e)
    }
  }

  const deleteNotification = async (id: string) => {
    const token = getAccessToken()
    if (!token) return

    try {
      await fetch(`${supabaseUrl}/rest/v1/notifications?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
        },
      })
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (e) {
      console.error('Delete error:', e)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_episode': return '📺'
      case 'comment_reply': return '💬'
      case 'watch_party_invite': return '🎉'
      case 'friend_request': return '👥'
      default: return '🔔'
    }
  }

  const getNotificationLink = (notification: Notification): string => {
    switch (notification.type) {
      case 'new_episode':
        return `/anime/${notification.data?.animeId}`
      case 'comment_reply':
        return `/anime/${notification.data?.anime_id}#comments`
      case 'watch_party_invite':
        return `/?party=${notification.data?.room_id}`
      default:
        return '/notifications'
    }
  }

  const getNotificationMessage = (notification: Notification): string => {
    switch (notification.type) {
      case 'new_episode':
        return `Новая серия: ${notification.title}`
      case 'comment_reply':
        return `${notification.data?.replier_name || 'Пользователь'} ответил: "${notification.data?.reply_content?.substring(0, 50) || ''}..."`
      case 'watch_party_invite':
        return `${notification.title}: ${notification.message}`
      case 'friend_request':
        return notification.message
      default:
        return notification.message || notification.title
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">🔔 Уведомления</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-neo-purple-light hover:text-neo-purple"
          >
            Прочитать все ({unreadCount})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-400 text-center py-8">Нет уведомлений</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`glass p-4 rounded-xl flex items-start gap-3 transition ${
                !notification.is_read ? 'bg-neo-purple/10 border-neo-purple/30' : ''
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="text-2xl flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold mb-1 ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
                  {notification.title}
                </p>
                <p className="text-sm text-gray-400 truncate">
                  {getNotificationMessage(notification)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                {notification.type !== 'friend_request' && (
                  <Link
                    href={getNotificationLink(notification)}
                    className="text-xs bg-neo-purple/20 hover:bg-neo-purple/40 text-neo-purple-light px-3 py-1 rounded-lg transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Открыть →
                  </Link>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteNotification(notification.id)
                  }}
                  className="text-gray-400 hover:text-red-400 text-xs transition"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}