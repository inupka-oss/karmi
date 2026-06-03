import { createServerSupabase } from '@/lib/supabase/server'
import AnimeGrid from '@/components/AnimeGrid'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const periodLabels: Record<string, string> = {
  all: '🏆 За всё время',
  year: '📅 За год',
  month: '📆 За месяц',
  week: '📊 За неделю',
}

const typeLabels: Record<string, string> = {
  all: 'Все типы',
  tv: 'TV-сериалы',
  movie: 'Фильмы',
  ova: 'OVA',
  ona: 'ONA',
}

export default async function TopPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string; type?: string; genre?: string }>
}) {
  const sp = await searchParams
  const period = sp?.period || 'all'
  const type = sp?.type || 'all'
  const genre = sp?.genre || ''
  
  const supabase = await createServerSupabase()

  // Получаем жанры для фильтра
  const { data: genres, error: genresError } = await supabase
    .from('genres')
    .select('*')
    .order('name')

  // Формируем запрос
  let query = supabase
    .from('anime')
    .select(`*, genres(name, slug)`, { count: 'exact' })

  // Фильтр по типу
  if (type !== 'all') {
    query = query.eq('type', type)
  }

  // Фильтр по жанру
  if (genre) {
    query = query.filter('genres.slug', 'eq', genre)
  }

  // Сортировка в зависимости от периода
  // Для простоты используем rating + created_at для симуляции "популярности за период"
  switch (period) {
    case 'week':
      query = query.order('rating', { ascending: false }).limit(50)
      break
    case 'month':
      query = query.order('rating', { ascending: false }).limit(75)
      break
    case 'year':
      query = query.order('rating', { ascending: false }).limit(100)
      break
    default:
      query = query.order('rating', { ascending: false }).limit(100)
  }

  const { data: anime, error: animeError } = await query

  // Логирование ошибок (в консоли сервера)
  if (animeError) {
    console.error('Error loading top anime:', animeError)
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 text-glow-white">
        {periodLabels[period]}
      </h1>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-3 mb-8">
        {/* Период */}
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
          {Object.entries(periodLabels).map(([key, label]) => (
            <Link
              key={key}
              href={`?period=${key}&type=${type}&genre=${genre}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                period === key
                  ? 'bg-neo-pink text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {label.split(' ')[0]}
            </Link>
          ))}
        </div>

        {/* Тип */}
        <select
          value={type}
          onChange={(e) => {
            window.location.href = `?period=${period}&type=${e.target.value}&genre=${genre}`
          }}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm"
        >
          {Object.entries(typeLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        {/* Жанр */}
        <select
          value={genre}
          onChange={(e) => {
            window.location.href = `?period=${period}&type=${type}&genre=${e.target.value}`
          }}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm"
        >
          <option value="">Все жанры</option>
          {genres?.map((g: any) => (
            <option key={g.slug} value={g.slug}>{g.name}</option>
          ))}
        </select>
      </div>

      {anime && anime.length > 0 ? (
        <>
          {/* Топ-3 с особым оформлением */}
          {anime.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {/* 2 место */}
              <div className="order-2 md:order-1 relative glass rounded-2xl overflow-hidden group">
                <div className="absolute top-3 left-3 z-10 w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  2
                </div>
                <AnimeGrid anime={[anime[1]]} />
              </div>
              
              {/* 1 место */}
              <div className="order-1 md:order-2 relative glass rounded-2xl overflow-hidden group ring-2 ring-yellow-500/50">
                <div className="absolute top-3 left-3 z-10 w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-yellow-500/50">
                  🥇
                </div>
                <AnimeGrid anime={[anime[0]]} />
              </div>
              
              {/* 3 место */}
              <div className="order-3 relative glass rounded-2xl overflow-hidden group">
                <div className="absolute top-3 left-3 z-10 w-12 h-12 bg-amber-700 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  3
                </div>
                <AnimeGrid anime={[anime[2]]} />
              </div>
            </div>
          )}

          {/* Остальные */}
          {anime.length > 3 && (
            <div className="relative">
              <h2 className="text-xl font-bold text-white mb-4">Топ-{anime.length}</h2>
              <AnimeGrid anime={anime.slice(3)} />
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-400 text-center py-20">
          В этой категории пока нет аниме
        </p>
      )}
    </div>
  )
}