'use client'
import { useState, useEffect } from 'react'
import { getUserIdentifier } from '@/lib/auth'

export function useActiveViewers(animeId: string) {
  const [count, setCount] = useState(0)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  useEffect(() => {
    const userId = getUserIdentifier()

    const sendHeartbeat = () => {
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animeId, userIdentifier: userId }),
      }).catch(console.error)
    }

    sendHeartbeat()
    const heartbeatInterval = setInterval(sendHeartbeat, 30000)

    const fetchCount = async () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
      const res = await fetch(
        `${supabaseUrl}/rest/v1/active_viewers?select=user_identifier&anime_id=eq.${animeId}&last_seen=gt.${twoMinutesAgo}`,
        {
          headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
        }
      )
      if (res.ok) {
        const data = await res.json()
        const uniqueUsers = new Set(data.map((d: any) => d.user_identifier))
        setCount(uniqueUsers.size)
      }
    }

    fetchCount()
    const countInterval = setInterval(fetchCount, 15000)

    return () => {
      clearInterval(heartbeatInterval)
      clearInterval(countInterval)
    }
  }, [animeId, supabaseUrl, supabaseAnonKey])

  return count
}