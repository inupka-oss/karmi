'use client'
import { useState, useEffect, useCallback } from 'react'
import { getAccessToken, getUserIdentifier } from '@/lib/auth'

export function useRatings() {
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Загружаем оценки при монтировании
  useEffect(() => {
    const loadRatings = async () => {
      const token = getAccessToken()
      const userId = getUserIdentifier()

      let query = `${supabaseUrl}/rest/v1/ratings?select=anime_id,rating`
      if (token) {
        // Авторизован – фильтруем по user_identifier из профиля
        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
        })
        if (userRes.ok) {
          const user = await userRes.json()
          query += `&user_identifier=eq.${user.id}`
        } else {
          query += `&user_identifier=eq.${userId}`
        }
      } else {
        query += `&user_identifier=eq.${userId}`
      }

      const res = await fetch(query, {
        headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const data: { anime_id: string; rating: number }[] = await res.json()
        const ratingsMap: Record<string, number> = {}
        data.forEach(r => { ratingsMap[r.anime_id] = r.rating })
        setRatings(ratingsMap)
      }
    }
    loadRatings()
  }, [supabaseUrl, supabaseAnonKey])

  const setRating = useCallback(async (animeId: string, rating: number) => {
    const token = getAccessToken()
    const userId = getUserIdentifier()
    let identifier = userId

    if (token) {
      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
      })
      if (userRes.ok) {
        const user = await userRes.json()
        identifier = user.id
      }
    }

    // Сохраняем в Supabase
    await fetch(`${supabaseUrl}/rest/v1/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token || ''}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        anime_id: animeId,
        user_identifier: identifier,
        rating,
      }),
    })

    setRatings(prev => ({ ...prev, [animeId]: rating }))
  }, [supabaseUrl, supabaseAnonKey])

  return { ratings, setRating }
}