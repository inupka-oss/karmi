'use client'
import { useEffect, useState } from 'react'

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 bg-neo-purple/90 backdrop-blur-sm text-white w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border border-white/20 shadow-lg hover:bg-neo-purple hover:scale-105 transition-all duration-200 animate-fade-in min-w-[48px] min-h-[48px]"
      title="Наверх"
      aria-label="Прокрутить наверх"
    >
      ↑
    </button>
  )
}