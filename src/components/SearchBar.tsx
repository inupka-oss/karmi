'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/?q=${encodeURIComponent(query)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="Поиск аниме..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-neo-pink w-[200px] sm:w-[240px]"
      />
      <button type="submit" className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-xl text-sm sm:text-base whitespace-nowrap">
        Искать
      </button>
    </form>
  )
}