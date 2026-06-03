'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/', label: 'Главная', icon: '🏠' },
  { href: '/catalog', label: 'Каталог', icon: '📖' },
  { href: '/ongoing', label: 'Онгоинги', icon: '📺' },
  { href: '/top', label: 'Топ', icon: '🏆' },
  { href: '/favorites', label: 'Избранное', icon: '❤️' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      // Скрываем при скролле вниз, показываем при скролле вверх
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Показываем только на мобильных
  return (
    <>
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t border-white/10 transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-around items-center py-2 safe-area-pb">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition ${
                  isActive
                    ? 'text-neo-pink bg-neo-pink/10'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
      
      {/* Spacer для контента чтобы не перекрывался навигацией */}
      <div className="md:hidden h-20" />
    </>
  )
}
