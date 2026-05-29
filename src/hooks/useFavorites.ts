'use client'
import { useState, useEffect, useCallback } from 'react'

function getAccessToken(): string | null {
  const match = document.cookie.match(/sb-access-token=([^;]+)/)
  return match ? match[1] : null
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Загружаем избранное при монтировании
  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      // Авторизован – берём из облака
      const loadCloudFavorites = async () => {
        try {
          // Получаем user_id из токена (или можно из /auth/v1/user)
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
            if (data.length > 0 && data[0].favorites) {
              setFavorites(data[0].favorites)
            }
          }
        } catch {}
      }
      loadCloudFavorites()
    } else {
      // Гость – localStorage
      const stored = localStorage.getItem('karmi-favorites')
      if (stored) {
        setFavorites(JSON.parse(stored))
      }
    }
  }, [supabaseUrl, supabaseAnonKey])

  // Функция переключения
  const toggleFavorite = useCallback(async (animeId: string) => {
    const token = getAccessToken()
    let newFavs: string[]

    setFavorites(prev => {
      newFavs = prev.includes(animeId)
        ? prev.filter(id => id !== animeId)
        : [...prev, animeId]

      if (token) {
        // Сохраняем в облако
        const saveToCloud = async () => {
          // Получаем user_id
          const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
          })
          if (!userRes.ok) return
          const user = await userRes.json()
          const userId = user.id

          await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${token}`,
              'Prefer': 'resolution=merge-duplicates',
            },
            body: JSON.stringify({
              user_identifier: userId,
              favorites: newFavs,
            }),
          })
        }
        saveToCloud()
      } else {
        // Гость – localStorage
        localStorage.setItem('karmi-favorites', JSON.stringify(newFavs))
      }
      return newFavs
    })
  }, [supabaseUrl, supabaseAnonKey])

  const isFavorite = useCallback((animeId: string) => favorites.includes(animeId), [favorites])

  return { favorites, toggleFavorite, isFavorite }
}