'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ email, password }),
      }
    )

    if (!res.ok) {
      const data = await res.json()
      setError(data.error_description || 'Ошибка входа')
      return
    }

    const data = await res.json()
    // Сохраняем токен в cookie (упрощённо)
    document.cookie = `sb-access-token=${data.access_token}; path=/; max-age=3600; SameSite=Lax`
    document.cookie = `sb-refresh-token=${data.refresh_token}; path=/; max-age=3600; SameSite=Lax`
    router.push('/admin/dashboard')
  }

  return (
    <div className="max-w-sm mx-auto mt-20 glass p-6 rounded-2xl">
      <h1 className="text-2xl font-bold mb-4">Вход в админку</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
          required
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="bg-neo-pink hover:bg-neo-pink/80 text-white py-2 rounded-xl">
          Войти
        </button>
      </form>
    </div>
  )
}