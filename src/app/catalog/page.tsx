'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import AnimeGrid from '@/components/AnimeGrid'
import AnimeGridSkeleton from '@/components/AnimeGridSkeleton'
import SearchBar from '@/components/SearchBar'
import { FilterIcon } from '@/components/Icons'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'ongoing', label: 'Выходит' },
  { value: 'completed', label: 'Завершён' },
  { value: 'announced', label: 'Анонсирован' },
]

export default function CatalogPage() {
  const [anime, setAnime] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [genres, setGenres] = useState<any[]>([])
  const [filters, setFilters] = useState({ q: '', genre: '', year: '', status: 'all' })
  const [showFilters, setShowFilters] = useState(true)
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

  const activeFilterCount = [filters.genre, filters.year, filters.status !== 'all' ? filters.status : ''].filter(Boolean).length

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-glow-white">
          Каталог
        </h1>
        <p className="text-gray-400 mt-2 text-sm sm:text-base">
          Найди своё идеальное аниме
        </p>
      </div>

      {/* Поиск */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchBar />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 text-sm font-medium ${
            showFilters 
              ? 'bg-neo-purple/15 border-neo-purple/30 text-neo-purple-light' 
              : 'bg-white/10 border-white/10 text-gray-300 hover:bg-white/15'
          }`}
        >
          <FilterIcon className="w-4 h-4" />
          Фильтры
          {activeFilterCount > 0 && (
            <span className="bg-neo-purple text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Фильтры */}
      {showFilters && (
        <form onSubmit={handleFilterSubmit} className="glass rounded-2xl p-4 sm:p-6 mb-6 animate-fade-in">
          <div className="flex flex-wrap items-end gap-4">
            {/* Жанр */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Жанр
              </label>
              <select 
                name="genre" 
                defaultValue={filters.genre} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-neo-purple focus:ring-2 focus:ring-neo-purple/20 transition-all appearance-none"
              >
                <option value="">Все жанры</option>
                {genres.map((g: any) => (
                  <option key={g.slug} value={g.slug}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Год */}
            <div className="w-full sm:w-32">
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Год
              </label>
              <input 
                type="number" 
                name="year" 
                placeholder="2024" 
                defaultValue={filters.year} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-neo-purple focus:ring-2 focus:ring-neo-purple/20 transition-all" 
              />
            </div>

            {/* Статус */}
            <div className="w-full sm:w-44">
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Статус
              </label>
              <select 
                name="status" 
                defaultValue={filters.status} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-neo-purple focus:ring-2 focus:ring-neo-purple/20 transition-all appearance-none"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Кнопка */}
            <button 
              type="submit" 
              className="bg-gradient-to-r from-neo-purple to-neo-purple-dark text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-neon-hover hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              Применить
            </button>
          </div>
        </form>
      )}

      {/* Результаты */}
      <AnimeGrid anime={anime} />

      {/* Индикатор загрузки и триггер для бесконечной прокрутки */}
      <div ref={loadMoreRef} className="flex justify-center py-8">
        {loading && <AnimeGridSkeleton count={4} />}
        {!hasMore && anime.length > 0 && (
          <p className="text-gray-500 text-sm">Все аниме загружены</p>
        )}
        {!loading && anime.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">Ничего не найдено</p>
            <p className="text-gray-600 text-sm mt-2">Попробуйте изменить фильтры</p>
          </div>
        )}
      </div>
    </div>
  )
}