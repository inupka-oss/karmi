'use client'
import { useRouter } from 'next/navigation'

export default function RandomAnimeButton() {
  const router = useRouter()

  const handleClick = async () => {
    const res = await fetch('/api/random-anime')
    if (res.ok) {
      const data = await res.json()
      if (data.id) {
        router.push(`/anime/${data.id}`)
      }
    }
  }

  return (
    <button
      onClick={handleClick}
      className="bg-white/10 hover:bg-white/20 text-white px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base transition"
      title="Случайное аниме"
    >
      🎲
    </button>
  )
}