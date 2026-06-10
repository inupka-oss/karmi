'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useFavorites } from '@/hooks/useFavorites'
import { useNotifications } from '@/hooks/useNotifications'
import { BellIcon, SunIcon, MoonIcon, PaletteIcon, MenuIcon, XIcon, HeartIcon, UserIcon, UsersIcon, SearchIcon } from './Icons'

type Theme = 'dark' | 'light' | 'blue'

export default function Header() {
  const pathname = usePathname()
  const [theme, setTheme] = useState<Theme>('dark')
  const [loggedIn, setLoggedIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [friendsCount, setFriendsCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const { favorites } = useFavorites()
  const { clearNotifications, unreadCount } = useNotifications()

  const loadFriendsCount = useCallback(async () => {
    try {
      const token = document.cookie.match(/sb-access-token=([^;]+)/)?.[1]
      if (!token) return
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const res = await fetch(`${supabaseUrl}/rest/v1/user_friends?status=eq.accepted`, {
        headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setFriendsCount(data.length || 0)
      }
    } catch {}
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('karmi-theme')
    if (saved === 'light') setTheme('light')
    else if (saved === 'blue') setTheme('blue')
    const hasToken = document.cookie.includes('sb-access-token=')
    setLoggedIn(hasToken)
    if (hasToken) loadFriendsCount()
  }, [loadFriendsCount])

  useEffect(() => {
    document.documentElement.classList.remove('light', 'blue')
    if (theme === 'light') document.documentElement.classList.add('light')
    else if (theme === 'blue') document.documentElement.classList.add('blue')
    localStorage.setItem('karmi-theme', theme)
  }, [theme])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(p => p === 'dark' ? 'light' : p === 'light' ? 'blue' : 'dark')
  }, [])

  const themeIcons: Record<Theme, React.ReactNode> = {
    dark: <SunIcon className="w-4 h-4" />,
    light: <MoonIcon className="w-4 h-4" />,
    blue: <PaletteIcon className="w-4 h-4" />,
  }

  const navLink = (href: string, label: string) => {
    const active = pathname === href
    return (
      <Link
        key={href}
        href={href}
        className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
          active
            ? 'text-white'
            : 'text-white/50 hover:text-white/80'
        }`}
      >
        {active && (
          <span className="absolute inset-0 bg-gradient-to-r from-neo-purple to-neo-pink rounded-full opacity-90" />
        )}
        <span className="relative z-10">{label}</span>
      </Link>
    )
  }

  const handleNavClick = useCallback(() => setMenuOpen(false), [])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? 'glass border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.3)]'
          : 'border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1 shrink-0" onClick={handleNavClick}>
          <span className="text-xl font-bold">
            <span className="text-white">Kar</span>
            <span className="bg-gradient-to-r from-neo-purple to-neo-pink bg-clip-text text-transparent">mi</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
          {navLink('/', 'Главная')}
          {navLink('/catalog', 'Каталог')}
          {navLink('/ongoing', 'Онгоинги')}
          {navLink('/top', 'Топ-100')}
          {navLink('/schedule', 'Расписание')}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="relative p-2 rounded-xl hover:bg-white/10 transition-colors"
            onClick={() => clearNotifications()}
          >
            <BellIcon className="w-[18px] h-[18px] text-white/60 hover:text-white transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-neo-pink to-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-white/10 transition-colors" title={theme}>
            <span className="text-white/60 hover:text-white transition-colors">{themeIcons[theme]}</span>
          </button>

          <Link
            href={loggedIn ? '/profile' : '/login'}
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              loggedIn
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'btn-primary text-white'
            }`}
          >
            {loggedIn ? 'Профиль' : 'Войти'}
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Меню"
          >
            {menuOpen ? <XIcon className="w-5 h-5 text-white/70" /> : <MenuIcon className="w-5 h-5 text-white/70" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden glass border-t border-white/5 animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {[
              { href: '/', label: 'Главная' },
              { href: '/catalog', label: 'Каталог' },
              { href: '/ongoing', label: 'Онгоинги' },
              { href: '/top', label: 'Топ-100' },
              { href: '/schedule', label: 'Расписание' },
              { href: '/favorites', label: 'Избранное' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === item.href
                    ? 'bg-gradient-to-r from-neo-purple/20 to-neo-pink/20 text-white border border-neo-purple/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
                {item.href === '/favorites' && favorites.length > 0 && (
                  <span className="ml-auto text-xs bg-neo-purple/30 text-neo-purple-light px-2 py-0.5 rounded-full">
                    {favorites.length}
                  </span>
                )}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/5">
              {loggedIn ? (
                <Link href="/profile" onClick={handleNavClick} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5">
                  <UserIcon className="w-4 h-4" /> Профиль
                </Link>
              ) : (
                <Link href="/login" onClick={handleNavClick} className="btn-primary block text-center text-sm">
                  Войти
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}