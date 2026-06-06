'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import AnimeGrid from '@/components/AnimeGrid'
import AnimeGridSkeleton from '@/components/AnimeGridSkeleton'
import SearchBar from '@/components/SearchBar'

const PAGE_SIZE = 20

export default function CatalogPage() {
  const [anime, setAnime] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [genres, setGenres] = useState<any[]>([])
  const [filters, setFilters] = useState({ q: '', genre: '', year: '', status: 'all' })
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Загрузка жанров
  useEffect(() => {
    fetch(`${supabaseUrl}/rest/v1/genres?select=*`, {
      headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(setGenres)
  }, [supabaseUrl, supabaseAnonKey])

  // Сброс при изменении фильтров
  useEffect(() => {
    setAnime([])
    setPage(1)
    setHasMore(true)
  }, [filters])

  // Загрузка данных
  useEffect(() => {
    if (!hasMore || loading) return
    setLoading(true)

    let query = `${supabaseUrl}/rest/v1/anime?select=*,genres(name,slug)&limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}&order=created_at.desc`

    if (filters.q) {
      query += `&or=(title_ru.ilike.*${filters.q}*,title_en.ilike.*${filters.q}*)`
    }
    if (filters.genre) {
      query += `&genres.slug=eq.${filters.genre}`
    }
    if (filters.year) {
      query += `&year=eq.${filters.year}`
    }
    if (filters.status && filters.status !== 'all') {
      query += `&status=eq.${filters.status}`
    }

    fetch(query, {
      headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.length < PAGE_SIZE) setHasMore(false)
        setAnime(prev => [...prev, ...data])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page, filters, hasMore, supabaseUrl, supabaseAnonKey])

  // Наблюдатель для бесконечной прокрутки
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0]
      if (target.isIntersecting && hasMore && !loading) {
        setPage(prev => prev + 1)
      }
    },
    [hasMore, loading]
  )

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(handleObserver, { threshold: 0.1 })
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current)
    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [handleObserver])

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const formData = new FormData(form)
    setFilters({
      q: formData.get('q') as string || '',
      genre: formData.get('genre') as string || '',
      year: formData.get('year') as string || '',
      status: formData.get('status') as string || 'all',
    })
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 text-glow-white">
        Каталог аниме
      </h1>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SearchBar />
      </div>

      <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-3 mb-6">
        <select name="genre" defaultValue={filters.genre} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm sm:text-base w-full sm:w-auto">
          <option value="">Все жанры</option>
          {genres.map((g: any) => (
            <option key={g.slug} value={g.slug}>{g.name}</option>
          ))}
        </select>
        <input type="number" name="year" placeholder="Год" defaultValue={filters.year} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm sm:text-base w-full sm:w-24" />
        <select name="status" defaultValue={filters.status} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm sm:text-base w-full sm:w-auto">
          <option value="all">Все статусы</option>
          <option value="ongoing">Выходит</option>
          <option value="completed">Завершён</option>
          <option value="announced">Анонсирован</option>
        </select>
        <button type="submit" className="bg-neo-purple hover:bg-neo-purple-dark text-white px-5 py-2 rounded-xl text-sm sm:text-base transition-all duration-200 hover:scale-105 font-medium shadow-neon">Фильтровать</button>
      </form>

      <AnimeGrid anime={anime} />

      {/* Индикатор загрузки и триггер для бесконечной прокрутки */}
      <div ref={loadMoreRef} className="flex justify-center py-8">
        {loading && <AnimeGridSkeleton count={4} />}
        {!hasMore && anime.length > 0 && (
          <p className="text-gray-400">Все аниме загружены</p>
        )}
      </div>
    </div>
  )
}