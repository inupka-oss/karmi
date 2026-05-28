'use client'
import { useState, useEffect } from 'react'

function getUserIdentifier() {
  let id = localStorage.getItem('karmi-user-id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('karmi-user-id', id)
  }
  return id
}

export default function RatingForm({ animeId }: { animeId: string }) {
  const [userRating, setUserRating] = useState<number | null>(null)
  const [average, setAverage] = useState<number | null>(null)
  const [count, setCount] = useState(0)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const loadRatings = async () => {
    const res = await fetch(`${supabaseUrl}/rest/v1/ratings?anime_id=eq.${animeId}`, {
      headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.length > 0) {
        const avg = data.reduce((sum: number, r: any) => sum + r.rating, 0) / data.length
        setAverage(Math.round(avg * 10) / 10)
        setCount(data.length)
      }
    }
    // проверить свой голос
    const userId = getUserIdentifier()
    const myRes = await fetch(`${supabaseUrl}/rest/v1/ratings?anime_id=eq.${animeId}&user_identifier=eq.${userId}`, {
      headers: { 'apikey': supabaseAnonKey },
    })
    if (myRes.ok) {
      const myData = await myRes.json()
      if (myData.length > 0) setUserRating(myData[0].rating)
    }
  }

  useEffect(() => {
    loadRatings()
  }, [animeId])

  const handleVote = async (rating: number) => {
    const userId = getUserIdentifier()
    if (userRating) {
      // обновить свой голос
      await fetch(`${supabaseUrl}/rest/v1/ratings?anime_id=eq.${animeId}&user_identifier=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      })
    } else {
      await fetch(`${supabaseUrl}/rest/v1/ratings`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ anime_id: animeId, user_identifier: userId, rating }),
      })
    }
    setUserRating(rating)
    loadRatings()
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-400">Ваша оценка:</span>
        <div className="flex gap-1">
          {[1,2,3,4,5,6,7,8,9,10].map(num => (
            <button
              key={num}
              onClick={() => handleVote(num)}
              className={`text-lg ${userRating && num <= userRating ? 'text-yellow-400' : 'text-gray-600'} hover:text-yellow-300`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      {average !== null && (
        <p className="text-gray-400 text-sm">Средняя оценка: {average}/10 ({count} голосов)</p>
      )}
    </div>
  )
}