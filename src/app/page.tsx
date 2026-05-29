import { createServerSupabase } from '@/lib/supabase/server'
import AnimeGrid from '@/components/AnimeGrid'
import SearchBar from '@/components/SearchBar'
import RandomAnimeButton from '@/components/RandomAnimeButton'
import Link from 'next/link'

async function getGenres() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/genres?select=*`, {
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

const PAGE_SIZE = 20

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; genre?: string; year?: string; page?: string }>
}) {
  const sp = await searchParams
  const currentPage = parseInt(sp?.page || '1') || 1
  const supabase = await createServerSupabase()

  // Последние обновления
  const { data: recentlyUpdated } = await supabase
    .from('episodes')
    .select('anime_id, anime!inner(title_ru, poster_url, genres(name, slug))')
    .order('created_at', { ascending: false })
    .limit(10)

  const uniqueRecent = recentlyUpdated
    ? Array.from(new Map(recentlyUpdated.map((item: any) => [item.anime_id, item.anime])).values())
    : []

  // Популярное
  const { data: popular } = await supabase
    .from('anime')
    .select(`*, genres(name, slug)`)
    .order('rating', { ascending: false })
    .limit(10)

  // Онгоинги
  const { data: ongoing } = await supabase
    .from('anime')
    .select(`*, genres(name, slug)`)
    .eq('status', 'ongoing')
    .order('created_at', { ascending: false })
    .limit(10)

  // Поиск и фильтрация (показывается только если заданы параметры)
  let searchQuery = supabase.from('anime').select(`*, genres(name, slug)`, { count: 'exact' })
  if (sp?.q) {
    searchQuery = searchQuery.or(`title_ru.ilike.%${sp.q}%,title_en.ilike.%${sp.q}%`)
  }
  if (sp?.genre) {
    searchQuery = searchQuery.filter('genres.slug', 'eq', sp.genre)
  }
  if (sp?.year) {
    searchQuery = searchQuery.eq('year', parseInt(sp.year))
  }
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  searchQuery = searchQuery.range(from, to).order('created_at', { ascending: false })
  const { data: searchResults, count } = await searchQuery

  const genres = await getGenres()
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams()
    if (sp?.q) params.set('q', sp.q)
    if (sp?.genre) params.set('genre', sp.genre)
    if (sp?.year) params.set('year', sp.year)
    params.set('page', page.toString())
    return `/?${params.toString()}`
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 text-glow-white">
        Karmi
      </h1>

      <div className="flex flex-wrap items-center gap-3 mb-4 sm:mb-6">
        <SearchBar />
        <RandomAnimeButton />
        <Link href="/favorites" className="bg-white/10 hover:bg-white/20 text-white px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base transition" title="Избранное">♥</Link>
        <Link href="/ongoing" className="bg-white/10 hover:bg-white/20 text-white px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base transition" title="Онгоинги">📅</Link>
        <Link href="/profile" className="bg-white/10 hover:bg-white/20 text-white px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base transition" title="Профиль">👤</Link>
      </div>

      <form className="flex flex-wrap items-center gap-3 mb-6">
        <select name="genre" defaultValue={sp?.genre || ''} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm sm:text-base w-full sm:w-auto">
          <option value="">Все жанры</option>
          {genres.map((g: any) => (
            <option key={g.slug} value={g.slug}>{g.name}</option>
          ))}
        </select>
        <input type="number" name="year" placeholder="Год" defaultValue={sp?.year || ''} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm sm:text-base w-full sm:w-24" />
        <button type="submit" className="bg-neo-pink hover:bg-neo-pink/80 text-white px-5 py-2 rounded-xl text-sm sm:text-base">Фильтровать</button>
      </form>

      {/* Последние обновления */}
      {uniqueRecent.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">🔥 Последние обновления</h2>
          <AnimeGrid anime={uniqueRecent.slice(0, 6)} />
        </section>
      )}

      {/* Популярное */}
      {popular && popular.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">⭐ Популярное</h2>
          <AnimeGrid anime={popular} />
        </section>
      )}

      {/* Онгоинги */}
      {ongoing && ongoing.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">📺 Сейчас выходит</h2>
          <AnimeGrid anime={ongoing} />
        </section>
      )}

      {/* Результаты поиска (если заданы параметры) */}
      {searchResults && searchResults.length > 0 && (sp?.q || sp?.genre || sp?.year) && (
        <section className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">🔍 Результаты поиска</h2>
          <AnimeGrid anime={searchResults} />
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              {currentPage > 1 && (
                <Link href={buildPageUrl(currentPage - 1)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm sm:text-base transition">
                  ← Назад
                </Link>
              )}
              <span className="text-white text-sm sm:text-base">Страница {currentPage} из {totalPages}</span>
              {currentPage < totalPages && (
                <Link href={buildPageUrl(currentPage + 1)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm sm:text-base transition">
                  Вперед →
                </Link>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}