import { createServerSupabase } from '@/lib/supabase/server'
import type { Anime, Genre } from '@/types/anime'
import AnimeGrid from '@/components/AnimeGrid'
import SearchBar from '@/components/SearchBar'
import RandomAnimeButton from '@/components/RandomAnimeButton'
import RecentUpdatesSlider from '@/components/RecentUpdatesSlider'
import ContinueWatching from '@/components/ContinueWatching'
import Recommendations from '@/components/Recommendations'
import HeroSlider from '@/components/HeroSlider'
import Link from 'next/link'
import { FireIcon, RocketIcon, TvIcon, SearchIcon } from '@/components/Icons'

const PAGE_SIZE = 20

async function getGenres(): Promise<Genre[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/genres?select=*`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

interface SearchParams {
  q?: string
  genre?: string
  year?: string
  page?: string
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const sp = await searchParams
  const currentPage = parseInt(sp?.page || '1') || 1
  const supabase = await createServerSupabase()

  // Последние обновления
  const { data: recentlyUpdated } = await supabase
    .from('episodes')
    .select('id, episode_number, anime_id, created_at, anime!inner(title_ru, poster_url, genres(name, slug))')
    .order('created_at', { ascending: false })
    .limit(15)

  const uniqueRecent = recentlyUpdated || []

  // Популярное для HeroSlider и сетки
  const { data: popular } = await supabase
    .from('anime')
    .select(`*, genres(name, slug)`)
    .order('rating', { ascending: false })
    .limit(10)

  // Для HeroSlider берём топ-5 с баннерами
  const heroItems = (popular || []).slice(0, 5).map(a => ({
    id: a.id,
    title_ru: a.title_ru,
    title_en: a.title_en,
    description: a.description,
    poster_url: a.poster_url,
    banner_url: a.banner_url,
    rating: a.rating,
    genres: a.genres,
    year: a.year,
  }))

  // Онгоинги
  const { data: ongoing } = await supabase
    .from('anime')
    .select(`*, genres(name, slug)`)
    .eq('status', 'ongoing')
    .order('created_at', { ascending: false })
    .limit(10)

  // Поиск и фильтрация
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

  const buildPageUrl = (page: number): string => {
    const params = new URLSearchParams()
    if (sp?.q) params.set('q', sp.q)
    if (sp?.genre) params.set('genre', sp.genre)
    if (sp?.year) params.set('year', sp.year)
    params.set('page', page.toString())
    return `/?${params.toString()}`
  }

  return (
    <div className="min-h-screen">
      {/* Hero Slider */}
      {heroItems.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-4">
          <HeroSlider items={heroItems} />
        </section>
      )}

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-glow-white">
            Kar<span className="text-neo-purple text-glow-purple">mi</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">Смотри аниме онлайн бесплатно</p>
        </div>

        {/* Продолжить просмотр */}
        <ContinueWatching />

        {/* Рекомендации */}
        <Recommendations />

        {/* Поиск и случайное аниме */}
        <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-8">
          <SearchBar />
          <RandomAnimeButton />
        </div>

        {/* Фильтры */}
        <form className="flex flex-wrap items-center gap-3 mb-8">
          <select 
            name="genre" 
            defaultValue={sp?.genre || ''} 
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm sm:text-base w-full sm:w-auto focus:outline-none focus:border-neo-pink focus:ring-1 focus:ring-neo-pink/50 transition-all"
          >
            <option value="">Все жанры</option>
            {genres.map((g: any) => (
              <option key={g.slug} value={g.slug}>{g.name}</option>
            ))}
          </select>
          <input 
            type="number" 
            name="year" 
            placeholder="Год" 
            defaultValue={sp?.year || ''} 
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm sm:text-base w-full sm:w-28 focus:outline-none focus:border-neo-pink focus:ring-1 focus:ring-neo-pink/50 transition-all" 
          />
          <button 
            type="submit" 
            className="bg-neo-purple hover:bg-neo-purple-dark text-white px-6 py-2.5 rounded-xl text-sm sm:text-base transition-all duration-200 hover:scale-105 font-medium shadow-neon hover:shadow-neon-hover"
          >
            Фильтровать
          </button>
        </form>

        {uniqueRecent.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-2">
              <FireIcon className="w-6 h-6 text-neo-pink" /> Последние обновления
            </h2>
            <RecentUpdatesSlider items={uniqueRecent} />
          </section>
        )}

        {popular && popular.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-2">
              <RocketIcon className="w-6 h-6 text-neo-purple" /> Популярное
            </h2>
            <AnimeGrid anime={popular} />
          </section>
        )}

        {ongoing && ongoing.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-2">
              <TvIcon className="w-6 h-6 text-neo-pink" /> Сейчас выходит
            </h2>
            <AnimeGrid anime={ongoing} />
          </section>
        )}

        {searchResults && searchResults.length > 0 && (sp?.q || sp?.genre || sp?.year) && (
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-2">
              <SearchIcon className="w-6 h-6 text-neo-purple" /> Результаты поиска
            </h2>
            <AnimeGrid anime={searchResults} />
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                {currentPage > 1 && (
                  <Link 
                    href={buildPageUrl(currentPage - 1)} 
                    className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-sm sm:text-base transition-all duration-200 hover:scale-105 font-medium"
                  >
                    ← Назад
                  </Link>
                )}
                <span className="text-gray-300 text-sm sm:text-base font-medium">
                  Страница {currentPage} из {totalPages}
                </span>
                {currentPage < totalPages && (
                  <Link 
                    href={buildPageUrl(currentPage + 1)} 
                    className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-sm sm:text-base transition-all duration-200 hover:scale-105 font-medium"
                  >
                    Вперед →
                  </Link>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}