'use client'
import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (query.trim()) {
        router.push(`/?q=${encodeURIComponent(query.trim())}`)
      }
    },
    [query, router]
  )

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center" role="search" aria-label="Поиск аниме">
      <div className={`relative flex items-center bg-white/10 border rounded-xl transition-all duration-200 ${
        isFocused ? 'border-neo-purple ring-2 ring-neo-purple/20' : 'border-white/20'
      }`}>
        <svg 
          className="w-5 h-5 ml-3 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Поиск аниме..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="bg-transparent border-none px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-0 w-[200px] sm:w-[240px]"
          aria-label="Поисковый запрос"
        />
      </div>
      <button
        type="submit"
        className="bg-neo-purple hover:bg-neo-purple-dark text-white px-5 py-2 rounded-xl text-sm sm:text-base whitespace-nowrap transition-all duration-200 hover:scale-105 font-medium shadow-neon hover:shadow-neon-hover"
      >
        Искать
      </button>
    </form>
  )
}