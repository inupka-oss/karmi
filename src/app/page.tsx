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
  let query = supabase.from('anime').select(`*, genres(name, slug)`, { count: 'exact' })

  if (sp?.q) {
    query = query.or(`title_ru.ilike.%${sp.q}%,title_en.ilike.%${sp.q}%`)
  }
  if (sp?.genre) {
    query = query.filter('genres.slug', 'eq', sp.genre)
  }
  if (sp?.year) {
    query = query.eq('year', parseInt(sp.year))
  }

  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  query = query.range(from, to).order('created_at', { ascending: false })

  const { data: anime, count } = await query
  const genres = await getGenres()
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)

  // Функция для создания URL с параметрами
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams()
    if (sp?.q) params.set('q', sp.q)
    if (sp?.genre) params.set('genre', sp.genre)
    if (sp?.year) params.set('year', sp.year)
    params.set('page', page.toString())
    return `/?${params.toString()}`
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <SearchBar />
        <RandomAnimeButton />
        <Link href="/favorites" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition">
          ♥ Избранное
        </Link>
        <Link href="/ongoing" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition">
          📅 Онгоинги
        </Link>
        <Link href="/profile" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition">
          👤 Профиль
        </Link>
      </div>
      <form className="flex flex-wrap gap-4 mb-6">
        <select
          name="genre"
          defaultValue={sp?.genre || ''}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
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
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white w-24"
        />
        <button type="submit" className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-xl">
          Фильтровать
        </button>
      </form>
      <AnimeGrid anime={anime || []} />
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-8">
          {currentPage > 1 && (
            <Link href={buildPageUrl(currentPage - 1)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl">
              ← Назад
            </Link>
          )}
          <span className="text-white py-2">Страница {currentPage} из {totalPages}</span>
          {currentPage < totalPages && (
            <Link href={buildPageUrl(currentPage + 1)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl">
              Вперед →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}