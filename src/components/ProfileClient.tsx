'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfileClient({ email, accessToken }: { email: string; accessToken: string }) {
  const [nickname, setNickname] = useState(email.split('@')[0])
  const router = useRouter()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  useEffect(() => {
    const loadProfile = async () => {
      const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_identifier=eq.${email}`, {
        headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0 && data[0].nickname) {
          setNickname(data[0].nickname)
        }
      }
    }
    loadProfile()
  }, [email, accessToken, supabaseUrl, supabaseAnonKey])

  const handleLogout = () => {
    document.cookie = 'sb-access-token=; path=/; max-age=0'
    document.cookie = 'sb-refresh-token=; path=/; max-age=0'
    localStorage.removeItem('karmi-favorites') // очищаем локальное избранное гостя
    router.push('/login')
  }

  const handleSave = async () => {
    await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ user_identifier: email, nickname }),
    })
    alert('Профиль сохранён!')
  }

  return (
    <div className="max-w-md mx-auto mt-20 glass p-6 rounded-2xl text-white">
      <h1 className="text-2xl font-bold mb-4">Мой профиль</h1>
      <p className="text-gray-400 mb-4">Email: {email}</p>
      <div className="flex flex-col gap-3">
        <label className="text-sm text-gray-400">Никнейм</label>
        <input
          type="text"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
        />
        <button onClick={handleSave} className="bg-neo-pink hover:bg-neo-pink/80 text-white py-2 rounded-xl">
          Сохранить
        </button>
        <button onClick={handleLogout} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 py-2 rounded-xl mt-4">
          Выйти
        </button>
      </div>
    </div>
  )
}