'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useFavorites } from '@/hooks/useFavorites'
import { useNotifications } from '@/hooks/useNotifications'

export default function Header() {
  const pathname = usePathname()
  const [theme, setTheme] = useState<'dark' | 'light' | 'blue'>('dark')
  const [loggedIn, setLoggedIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [friendsCount, setFriendsCount] = useState(0)
  const { favorites } = useFavorites()
  const { newEpisodes, clearNotifications } = useNotifications()

  useEffect(() => {
    const saved = localStorage.getItem('karmi-theme')
    if (saved === 'light') setTheme('light')
    else if (saved === 'blue') setTheme('blue')
    const hasToken = document.cookie.includes('sb-access-token=')
    setLoggedIn(hasToken)
    
    // Загружаем количество друзей
    if (hasToken) {
      loadFriendsCount()
    }
  }, [])

  const loadFriendsCount = async () => {
    try {
      const token = document.cookie.match(/sb-access-token=([^;]+)/)?.[1]
      if (!token) return
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      const res = await fetch(`${supabaseUrl}/rest/v1/user_friends?status=eq.accepted`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (res.ok) {
        const data = await res.json()
        setFriendsCount(data.length || 0)
      }
    } catch (e) {
      console.error('Load friends count error:', e)
    }
  }

  useEffect(() => {
    document.documentElement.classList.remove('light', 'blue')
    if (theme === 'light') document.documentElement.classList.add('light')
    else if (theme === 'blue') document.documentElement.classList.add('blue')
    localStorage.setItem('karmi-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'light'
      if (prev === 'light') return 'blue'
      return 'dark'
    })
  }

  const themeIcon = theme === 'dark' ? '☀️' : theme === 'light' ? '🌙' : '🌌'

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      pathname === href ? 'bg-neo-pink/20 text-neo-pink' : 'text-gray-300 hover:text-white hover:bg-white/10'
    }`

  const handleNavClick = () => setMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 glass backdrop-blur-md border-b border-white/10 w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-4 py-3 w-full overflow-x-hidden">
        <Link href="/" className="text-2xl font-bold text-glow-white" onClick={handleNavClick}>
          Kar<span className="text-neo-pink">mi</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          <Link href="/" className={linkClass('/')}>Главная</Link>
          <Link href="/catalog" className={linkClass('/catalog')}>Каталог</Link>
          <Link href="/schedule" className={linkClass('/schedule')}>Расписание</Link>
          <Link href="/ongoing" className={linkClass('/ongoing')}>Онгоинги</Link>
          <Link href="/top" className={linkClass('/top')}>Топ-100</Link>
          <Link href="/favorites" className={linkClass('/favorites')}>
            <span className="text-neo-pink">♥</span> Избранное
            {favorites.length > 0 && (
              <span className="ml-1 text-xs bg-neo-pink text-white px-1.5 py-0.5 rounded-full">{favorites.length}</span>
            )}
          </Link>
          {loggedIn ? (
            <Link href="/profile" className={linkClass('/profile')}>Профиль</Link>
          ) : (
            <Link href="/login" className={linkClass('/login')}>Войти</Link>
          )}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Link href="/notifications" className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition flex-shrink-0" onClick={() => clearNotifications()}>
            🔔
            {newEpisodes.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full">
                {newEpisodes.length}
              </span>
            )}
          </Link>

          <button
            onClick={toggleTheme}
            className="text-base sm:text-lg px-2 sm:px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition flex-shrink-0"
            title={`Тема: ${theme}`}
          >
            {themeIcon}
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white p-2 rounded-xl bg-white/10 hover:bg-white/20 transition flex-shrink-0 min-w-[44px]"
            aria-label="Меню"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden glass border-t border-white/10 px-4 py-4 space-y-2 animate-fade-in max-h-[80vh] overflow-y-auto">
          <Link href="/" onClick={handleNavClick} className={`${linkClass('/')} block whitespace-nowrap overflow-hidden text-ellipsis`}>Главная</Link>
          <Link href="/catalog" onClick={handleNavClick} className={`${linkClass('/catalog')} block whitespace-nowrap overflow-hidden text-ellipsis`}>Каталог</Link>
          <Link href="/schedule" onClick={handleNavClick} className={`${linkClass('/schedule')} block whitespace-nowrap overflow-hidden text-ellipsis`}>Расписание</Link>
          <Link href="/ongoing" onClick={handleNavClick} className={`${linkClass('/ongoing')} block whitespace-nowrap overflow-hidden text-ellipsis`}>Онгоинги</Link>
          <Link href="/top" onClick={handleNavClick} className={`${linkClass('/top')} block whitespace-nowrap overflow-hidden text-ellipsis`}>Топ-100</Link>
          <Link href="/favorites" onClick={handleNavClick} className={`${linkClass('/favorites')} block whitespace-nowrap overflow-hidden text-ellipsis`}>
            <span className="text-neo-pink">♥</span> Избранное
            {favorites.length > 0 && (
              <span className="ml-2 text-xs bg-neo-pink text-white px-1.5 py-0.5 rounded-full">{favorites.length}</span>
            )}
          </Link>
          {loggedIn && (
            <Link href="/profile#friends" onClick={handleNavClick} className={`${linkClass('/profile')} block whitespace-nowrap overflow-hidden text-ellipsis`}>
              👥 Друзья
              {friendsCount > 0 && (
                <span className="ml-2 text-xs bg-neo-pink text-white px-1.5 py-0.5 rounded-full">{friendsCount}</span>
              )}
            </Link>
          )}
          <div className="pt-2 border-t border-white/10">
            {loggedIn ? (
              <Link href="/profile" onClick={handleNavClick} className={`${linkClass('/profile')} block whitespace-nowrap overflow-hidden text-ellipsis`}>Профиль</Link>
            ) : (
              <Link href="/login" onClick={handleNavClick} className={`${linkClass('/login')} block whitespace-nowrap overflow-hidden text-ellipsis`}>Войти</Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}