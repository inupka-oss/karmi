import { createServerSupabase } from '@/lib/supabase/server'
import type { Genre } from '@/types/anime'
import AnimeGrid from '@/components/AnimeGrid'
import SearchBar from '@/components/SearchBar'
import RandomAnimeButton from '@/components/RandomAnimeButton'
import RecentUpdatesSlider from '@/components/RecentUpdatesSlider'
import ContinueWatching from '@/components/ContinueWatching'
import Recommendations from '@/components/Recommendations'
import { PremiumHero } from '@/components/PremiumHero'
import Link from 'next/link'
import { FireIcon, RocketIcon, TvIcon, SearchIcon } from '@/components/Icons'

const PAGE_SIZE = 20

async function getGenres(): Promise<Genre[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/genres?select=*`, {
      headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

interface SearchParams { q?: string; genre?: string; year?: string; page?: string }

export default async function HomePage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const sp = await searchParams
  const currentPage = parseInt(sp?.page || '1') || 1
  const supabase = await createServerSupabase()

  const { data: recentlyUpdated } = await supabase
    .from('episodes')
    .select('id, episode_number, anime_id, created_at, anime!inner(title_ru, poster_url, genres(name, slug))')
    .order('created_at', { ascending: false }).limit(15)
  const uniqueRecent = recentlyUpdated || []

  const { data: popular } = await supabase
    .from('anime').select('*, genres(name, slug)').order('rating', { ascending: false }).limit(10)

  const heroItems = (popular || []).slice(0, 6).map(a => ({
    id: a.id, title_ru: a.title_ru, title_en: a.title_en, description: a.description,
    poster_url: a.poster_url, banner_url: a.banner_url, rating: a.rating, genres: a.genres, year: a.year,
  }))

  const { data: ongoing } = await supabase
    .from('anime').select('*, genres(name, slug)').eq('status', 'ongoing').order('created_at', { ascending: false }).limit(10)

  let searchQuery = supabase.from('anime').select('*, genres(name, slug)', { count: 'exact' })
  if (sp?.q) searchQuery = searchQuery.or(`title_ru.ilike.%${sp.q}%,title_en.ilike.%${sp.q}%`)
  if (sp?.genre) searchQuery = searchQuery.filter('genres.slug', 'eq', sp.genre)
  if (sp?.year) searchQuery = searchQuery.eq('year', parseInt(sp.year))
  const from = (currentPage - 1) * PAGE_SIZE
  searchQuery = searchQuery.range(from, from + PAGE_SIZE - 1).order('created_at', { ascending: false })
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
    <div className="min-h-screen">
      {/* Premium Hero with Floating Posters */}
      {heroItems.length > 0 && <PremiumHero items={heroItems} />}

      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* Continue Watching & Recommendations */}
        <ContinueWatching />
        <Recommendations />

        {/* Search */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <SearchBar />
          <RandomAnimeButton />
        </div>

        {/* Filters */}
        <form className="flex flex-wrap items-center gap-3 mb-10">
          <select name="genre" defaultValue={sp?.genre || ''} className="input-premium w-full sm:w-auto text-sm">
            <option value="">Все жанры</option>
            {genres.map((g: any) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
          </select>
          <input type="number" name="year" placeholder="Год" defaultValue={sp?.year || ''} className="input-premium w-full sm:w-28 text-sm" />
          <button type="submit" className="btn-primary text-sm px-6">Фильтровать</button>
        </form>

        {/* Sections with SVG icons */}
        {uniqueRecent.length > 0 && (
          <section className="mb-14">
            <h2 className="section-title">
              <FireIcon className="w-5 h-5 text-neo-pink" /> Последние обновления
            </h2>
            <RecentUpdatesSlider items={uniqueRecent} />
          </section>
        )}

        {popular && popular.length > 0 && (
          <section className="mb-14">
            <h2 className="section-title">
              <RocketIcon className="w-5 h-5 text-neo-purple" /> Популярное
            </h2>
            <AnimeGrid anime={popular} />
          </section>
        )}

        {ongoing && ongoing.length > 0 && (
          <section className="mb-14">
            <h2 className="section-title">
              <TvIcon className="w-5 h-5 text-neo-pink" /> Сейчас выходит
            </h2>
            <AnimeGrid anime={ongoing} />
          </section>
        )}

        {searchResults && searchResults.length > 0 && (sp?.q || sp?.genre || sp?.year) && (
          <section className="mb-14">
            <h2 className="section-title">
              <SearchIcon className="w-5 h-5 text-neo-purple" /> Результаты поиска
            </h2>
            <AnimeGrid anime={searchResults} />
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                {currentPage > 1 && (
                  <Link href={buildPageUrl(currentPage - 1)} className="btn-secondary text-sm px-5 py-2">← Назад</Link>
                )}
                <span className="text-white/30 text-sm">Страница {currentPage} из {totalPages}</span>
                {currentPage < totalPages && (
                  <Link href={buildPageUrl(currentPage + 1)} className="btn-secondary text-sm px-5 py-2">Вперёд →</Link>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}