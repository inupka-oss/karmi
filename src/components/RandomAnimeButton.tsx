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
      className="bg-neo-pink/20 hover:bg-neo-pink/40 text-neo-pink px-4 py-2 rounded-xl border border-neo-pink/50 transition"
    >
      🎲 Случайное аниме
    </button>
  )
}