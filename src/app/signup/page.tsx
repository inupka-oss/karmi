'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { EyeIcon } from '@/components/Icons'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/signup`,
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
        setError(data.error_description || 'Ошибка регистрации')
        setLoading(false)
        return
      }
      const data = await res.json()
      if (data.access_token) {
        document.cookie = `sb-access-token=${data.access_token}; path=/; max-age=604800; SameSite=Lax`
        document.cookie = `sb-refresh-token=${data.refresh_token}; path=/; max-age=604800; SameSite=Lax`
        router.push('/profile')
      } else {
        router.push('/login')
      }
    } catch {
      setError('Ошибка сети. Попробуйте снова.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-5xl font-bold text-glow-white">
              Kar<span className="text-neo-pink text-glow-pink">mi</span>
            </h1>
          </Link>
          <p className="text-gray-400 mt-3 text-sm">Создайте аккаунт и начните смотреть</p>
        </div>

        {/* Форма */}
        <div className="glass rounded-2xl p-8 backdrop-blur-xl">
          <form onSubmit={handleSignup} className="flex flex-col gap-5">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neo-purple focus:ring-2 focus:ring-neo-purple/20 transition-all"
                required
                autoComplete="email"
              />
            </div>

            {/* Пароль */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                Пароль
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Минимум 6 символов"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-neo-purple focus:ring-2 focus:ring-neo-purple/20 transition-all"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  <EyeIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Подтверждение пароля */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                Подтвердите пароль
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Повторите пароль"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neo-purple focus:ring-2 focus:ring-neo-purple/20 transition-all"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {/* Ошибка */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Кнопка */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-neo-purple to-neo-pink text-white py-3 rounded-xl font-semibold text-base transition-all duration-200 hover:shadow-neon-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Регистрация...
                </span>
              ) : (
                'Зарегистрироваться'
              )}
            </button>
          </form>

          {/* Разделитель */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-xs">или</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Вход */}
          <p className="text-center text-gray-400 text-sm">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-neo-purple-light hover:text-neo-purple font-medium transition-colors">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}