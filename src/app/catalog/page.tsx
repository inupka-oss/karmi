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

  useEffect(() => {
    fetch(`${supabaseUrl}/rest/v1/genres?select=*`, {
      headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
    }).then(r => r.json()).then(setGenres)
  }, [supabaseUrl, supabaseAnonKey])

  useEffect(() => { setAnime([]); setPage(1); setHasMore(true) }, [filters])

  useEffect(() => {
    if (!hasMore || loading) return
    setLoading(true)
    let query = `${supabaseUrl}/rest/v1/anime?select=*,genres(name,slug)&limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}&order=created_at.desc`
    if (filters.q) query += `&or=(title_ru.ilike.*${filters.q}*,title_en.ilike.*${filters.q}*)`
    if (filters.genre) query += `&genres.slug=eq.${filters.genre}`
    if (filters.year) query += `&year=eq.${filters.year}`
    if (filters.status !== 'all') query += `&status=eq.${filters.status}`
    fetch(query, { headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' } })
      .then(r => r.json())
      .then(data => { if (data.length < PAGE_SIZE) setHasMore(false); setAnime(p => [...p, ...data]); setLoading(false) })
      .catch(() => setLoading(false))
  }, [page, filters, hasMore, supabaseUrl, supabaseAnonKey])

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasMore && !loading) setPage(p => p + 1)
  }, [hasMore, loading])

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(handleObserver, { threshold: 0.1 })
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current)
    return () => { if (observerRef.current) observerRef.current.disconnect() }
  }, [handleObserver])

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget as HTMLFormElement)
    setFilters({ q: fd.get('q') as string || '', genre: fd.get('genre') as string || '', year: fd.get('year') as string || '', status: fd.get('status') as string || 'all' })
  }

  const activeCount = [filters.genre, filters.year, filters.status !== 'all' ? filters.status : ''].filter(Boolean).length

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">
          <span className="text-white">Ката</span>
          <span className="bg-gradient-to-r from-neo-purple to-neo-pink bg-clip-text text-transparent">лог</span>
        </h1>
        <p className="text-white/30 mt-2 text-sm">Найди своё идеальное аниме</p>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchBar />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-300 ${
            showFilters ? 'bg-neo-purple/15 border-neo-purple/30 text-neo-purple-light' : 'bg-white/5 border-white/5 text-white/40 hover:text-white/60'
          }`}
        >
          <FilterIcon className="w-4 h-4" />
          Фильтры
          {activeCount > 0 && <span className="bg-neo-purple text-white text-xs px-1.5 py-0.5 rounded-full">{activeCount}</span>}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <form onSubmit={handleFilterSubmit} className="glass rounded-2xl p-5 mb-6 animate-fade-in">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px] space-y-1.5">
              <label className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Жанр</label>
              <select name="genre" defaultValue={filters.genre} className="input-premium text-sm appearance-none">
                <option value="">Все жанры</option>
                {genres.map((g: any) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
              </select>
            </div>
            <div className="w-full sm:w-28 space-y-1.5">
              <label className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Год</label>
              <input type="number" name="year" placeholder="2024" defaultValue={filters.year} className="input-premium text-sm" />
            </div>
            <div className="w-full sm:w-40 space-y-1.5">
              <label className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Статус</label>
              <select name="status" defaultValue={filters.status} className="input-premium text-sm appearance-none">
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary text-sm px-6 py-2.5">Применить</button>
          </div>
        </form>
      )}

      {/* Results */}
      <AnimeGrid anime={anime} />

      <div ref={loadMoreRef} className="flex justify-center py-8">
        {loading && <AnimeGridSkeleton count={4} />}
        {!hasMore && anime.length > 0 && <p className="text-white/20 text-sm">Все аниме загружены</p>}
        {!loading && anime.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/30 text-lg">Ничего не найдено</p>
            <p className="text-white/15 text-sm mt-1">Попробуйте изменить фильтры</p>
          </div>
        )}
      </div>
    </div>
  )
}