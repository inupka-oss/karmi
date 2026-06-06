'use client'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

export default function RandomAnimeButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/random-anime')
      if (res.ok) {
        const data = await res.json()
        if (data.id) {
          router.push(`/anime/${data.id}`)
        }
      }
    } catch {
      console.error('Failed to get random anime')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="bg-neo-purple/10 hover:bg-neo-purple/20 disabled:bg-gray-500/50 text-white px-4 sm:px-5 py-2.5 rounded-xl text-sm sm:text-base transition-all duration-200 hover:scale-105 flex items-center gap-2 font-medium border border-neo-purple/20 hover:border-neo-purple/40"
      title="Случайное аниме"
      aria-label="Найти случайное аниме"
    >
      <span className="text-lg" aria-hidden="true">🎲</span>
      <span className="hidden sm:inline">{isLoading ? 'Загрузка...' : 'Случайное'}</span>
    </button>
  )
}