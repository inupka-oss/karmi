'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/admin/dashboard')
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 glass p-6 rounded-2xl">
      <h1 className="text-2xl font-bold mb-4">Вход в админку</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white" required />
        <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white" required />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="bg-neo-pink hover:bg-neo-pink/80 text-white py-2 rounded-xl">Войти</button>
      </form>
    </div>
  )
}