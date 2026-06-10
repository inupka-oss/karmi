'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useFavorites } from '@/hooks/useFavorites'
import { useNotifications } from '@/hooks/useNotifications'
import { BellIcon, SunIcon, MoonIcon, PaletteIcon, MenuIcon, XIcon, HeartIcon, UserIcon, UsersIcon } from './Icons'

type Theme = 'dark' | 'light' | 'blue'

export default function Header() {
  const pathname = usePathname()
  const [theme, setTheme] = useState<Theme>('dark')
  const [loggedIn, setLoggedIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [friendsCount, setFriendsCount] = useState(0)
  const { favorites } = useFavorites()
  const { clearNotifications, unreadCount } = useNotifications()

  const loadFriendsCount = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('karmi-theme')
    if (saved === 'light') setTheme('light')
    else if (saved === 'blue') setTheme('blue')
    const hasToken = document.cookie.includes('sb-access-token=')
    setLoggedIn(hasToken)
    
    if (hasToken) {
      loadFriendsCount()
    }
  }, [loadFriendsCount])

  useEffect(() => {
    document.documentElement.classList.remove('light', 'blue')
    if (theme === 'light') document.documentElement.classList.add('light')
    else if (theme === 'blue') document.documentElement.classList.add('blue')
    localStorage.setItem('karmi-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      if (prev === 'dark') return 'light'
      if (prev === 'light') return 'blue'
      return 'dark'
    })
  }, [])

  const themeLabels: Record<Theme, string> = {
    dark: 'Тёмная',
    light: 'Светлая',
    blue: 'Синяя',
  }

  const themeIcons: Record<Theme, React.ReactNode> = {
    dark: <SunIcon className="w-4 h-4" />,
    light: <MoonIcon className="w-4 h-4" />,
    blue: <PaletteIcon className="w-4 h-4" />,
  }

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      pathname === href
        ? 'bg-neo-purple/15 text-neo-purple-light'
        : 'text-gray-300 hover:text-white hover:bg-white/10'
    }`

  const handleNavClick = useCallback(() => setMenuOpen(false), [])

  return (
    <header
      className="sticky top-0 z-50 glass backdrop-blur-md border-b border-white/10 w-full overflow-x-hidden"
      role="banner"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-4 py-3 w-full overflow-x-hidden">
        <Link
          href="/"
          className="text-2xl font-bold text-glow-white"
          onClick={handleNavClick}
          aria-label="Karmi - на главную"
        >
          Kar<span className="text-neo-pink">mi</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2" role="navigation" aria-label="Основная навигация">
          <Link href="/" className={linkClass('/')} aria-current={pathname === '/' ? 'page' : undefined}>
            Главная
          </Link>
          <Link href="/catalog" className={linkClass('/catalog')} aria-current={pathname === '/catalog' ? 'page' : undefined}>
            Каталог
          </Link>
          <Link href="/schedule" className={linkClass('/schedule')} aria-current={pathname === '/schedule' ? 'page' : undefined}>
            Расписание
          </Link>
          <Link href="/ongoing" className={linkClass('/ongoing')} aria-current={pathname === '/ongoing' ? 'page' : undefined}>
            Онгоинги
          </Link>
          <Link href="/top" className={linkClass('/top')} aria-current={pathname === '/top' ? 'page' : undefined}>
            Топ-100
          </Link>
          <Link
            href="/favorites"
            className={linkClass('/favorites')}
            aria-current={pathname === '/favorites' ? 'page' : undefined}
          >
            <span className="inline-flex items-center gap-1">
              <HeartIcon className="w-4 h-4 text-neo-purple-light" />
              Избранное
            </span>
            {favorites.length > 0 && (
              <span className="ml-1 text-xs bg-neo-purple text-white px-1.5 py-0.5 rounded-full" aria-label={`${favorites.length} избранных`}>
                {favorites.length}
              </span>
            )}
          </Link>
          {loggedIn ? (
            <Link href="/profile" className={linkClass('/profile')} aria-current={pathname === '/profile' ? 'page' : undefined}>
              Профиль
            </Link>
          ) : (
            <Link href="/login" className={linkClass('/login')}>
              Войти
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Link
            href="/notifications"
            className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition flex-shrink-0"
            onClick={() => clearNotifications()}
            aria-label={`Уведомления${unreadCount > 0 ? `: ${unreadCount} новых` : ''}`}
          >
            <BellIcon className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full"
                role="status"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition flex-shrink-0 flex items-center gap-1.5"
            title={`Тема: ${themeLabels[theme]}`}
            aria-label={`Переключить тему (сейчас: ${themeLabels[theme]})`}
          >
            {themeIcons[theme]}
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white p-2 rounded-xl bg-white/10 hover:bg-white/20 transition flex-shrink-0 min-w-[44px] flex items-center justify-center"
            aria-label="Меню"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden glass border-t border-white/10 px-4 py-4 space-y-1 animate-fade-in max-h-[80vh] overflow-y-auto"
          role="menu"
          aria-label="Мобильное меню"
        >
          <Link
            href="/"
            onClick={handleNavClick}
            className={`${linkClass('/')} block whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px] flex items-center`}
            role="menuitem"
          >
            Главная
          </Link>
          <Link
            href="/catalog"
            onClick={handleNavClick}
            className={`${linkClass('/catalog')} block whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px] flex items-center`}
            role="menuitem"
          >
            Каталог
          </Link>
          <Link
            href="/schedule"
            onClick={handleNavClick}
            className={`${linkClass('/schedule')} block whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px] flex items-center`}
            role="menuitem"
          >
            Расписание
          </Link>
          <Link
            href="/ongoing"
            onClick={handleNavClick}
            className={`${linkClass('/ongoing')} block whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px] flex items-center`}
            role="menuitem"
          >
            Онгоинги
          </Link>
          <Link
            href="/top"
            onClick={handleNavClick}
            className={`${linkClass('/top')} block whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px] flex items-center`}
            role="menuitem"
          >
            Топ-100
          </Link>
          <Link
            href="/favorites"
            onClick={handleNavClick}
            className={`${linkClass('/favorites')} block whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px] flex items-center`}
            role="menuitem"
          >
            <HeartIcon className="w-4 h-4 text-neo-purple-light" /> Избранное
            {favorites.length > 0 && (
              <span className="ml-2 text-xs bg-neo-purple text-white px-2 py-0.5 rounded-full">
                {favorites.length}
              </span>
            )}
          </Link>
          {loggedIn && (
            <Link
              href="/profile#friends"
              onClick={handleNavClick}
              className={`${linkClass('/profile')} block whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px] flex items-center`}
              role="menuitem"
            >
              <UsersIcon className="w-4 h-4" /> Друзья
              {friendsCount > 0 && (
                <span className="ml-2 text-xs bg-neo-purple text-white px-2 py-0.5 rounded-full">
                  {friendsCount}
                </span>
              )}
            </Link>
          )}
          <div className="pt-3 border-t border-white/10">
            {loggedIn ? (
              <Link
                href="/profile"
                onClick={handleNavClick}
                className={`${linkClass('/profile')} block whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px] flex items-center`}
                role="menuitem"
              >
                <UserIcon className="w-4 h-4" /> Профиль
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={handleNavClick}
                className={`${linkClass('/login')} block whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px] flex items-center`}
                role="menuitem"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}