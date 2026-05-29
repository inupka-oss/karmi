'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Header() {
  const pathname = usePathname()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('karmi-theme')
    if (saved === 'light') setTheme('light')
    const hasToken = document.cookie.includes('sb-access-token=')
    setLoggedIn(hasToken)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('karmi-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      pathname === href ? 'bg-neo-pink/20 text-neo-pink' : 'text-gray-300 hover:text-white hover:bg-white/10'
    }`

  return (
    <header className="sticky top-0 z-50 glass backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-2xl font-bold text-glow-white">
          Kar<span className="text-neo-pink">mi</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          <Link href="/" className={linkClass('/')}>Главная</Link>
          <Link href="/catalog" className={linkClass('/catalog')}>Каталог</Link>
          <Link href="/ongoing" className={linkClass('/ongoing')}>Онгоинги</Link>
          <Link href="/favorites" className={linkClass('/favorites')}>
            <span className="text-neo-pink">♥</span> Избранное
          </Link>
          {loggedIn ? (
            <Link href="/profile" className={linkClass('/profile')}>Профиль</Link>
          ) : (
            <Link href="/login" className={linkClass('/login')}>Войти</Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="text-lg px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
            title="Переключить тему"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  )
}