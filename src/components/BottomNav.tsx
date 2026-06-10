'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { HomeIcon, BookOpenIcon, TvIcon, TrophyIcon, HeartIcon } from './Icons'

const navItems = [
  { href: '/', label: 'Главная', Icon: HomeIcon },
  { href: '/catalog', label: 'Каталог', Icon: BookOpenIcon },
  { href: '/ongoing', label: 'Онгоинги', Icon: TvIcon },
  { href: '/top', label: 'Топ', Icon: TrophyIcon },
  { href: '/favorites', label: 'Избранное', Icon: HeartIcon },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY < 50) {
        setIsVisible(true)
        setLastScrollY(currentScrollY)
        return
      }
      
      if (currentScrollY > lastScrollY) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <>
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t border-white/10 transition-transform duration-300 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ willChange: 'transform' }}
      >
        <div className="flex justify-around items-center py-2 safe-area-pb">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-neo-purple-light bg-neo-purple/20 scale-105'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium">{item.label}</span>
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