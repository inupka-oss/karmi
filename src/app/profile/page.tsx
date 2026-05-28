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

export default function ProfilePage() {
  const [nickname, setNickname] = useState('Аноним')
  const [favorites, setFavorites] = useState<string[]>([])
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  useEffect(() => {
    const userId = getUserIdentifier()
    fetch(`${supabaseUrl}/rest/v1/user_profiles?user_identifier=eq.${userId}`, {
      headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setNickname(data[0].nickname)
          setFavorites(data[0].favorites || [])
        }
      })
  }, [])

  const saveProfile = async () => {
    const userId = getUserIdentifier()
    await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_identifier: userId,
        nickname,
        favorites,
      }),
    })
    alert('Профиль сохранён!')
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto text-white">
      <h1 className="text-4xl font-bold text-glow-white mb-6">Мой профиль</h1>
      <div className="glass p-6 rounded-2xl space-y-4">
        <div>
          <label className="block text-gray-400 mb-1">Никнейм</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white w-full"
          />
        </div>
        <button onClick={saveProfile} className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-xl">
          Сохранить
        </button>
      </div>
    </div>
  )
}