import { createServerSupabase } from '@/lib/supabase/server'
import AnimeGrid from '@/components/AnimeGrid'
import SearchBar from '@/components/SearchBar'
import RandomAnimeButton from '@/components/RandomAnimeButton'

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

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; genre?: string; year?: string }>
}) {
  const sp = await searchParams
  const supabase = await createServerSupabase()
  let query = supabase.from('anime').select(`*, genres(name, slug)`)

  if (sp?.q) {
    query = query.or(`title_ru.ilike.%${sp.q}%,title_en.ilike.%${sp.q}%`)
  }
  if (sp?.genre) {
    query = query.filter('genres.slug', 'eq', sp.genre)
  }
  if (sp?.year) {
    query = query.eq('year', parseInt(sp.year))
  }

  const { data: anime } = await query.order('created_at', { ascending: false })
  const genres = await getGenres()

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto">
      <h1 className="text-5xl md:text-7xl font-bold mb-2 text-glow-white">
        Kar<span className="text-neo-pink text-glow-pink">mi</span>
      </h1>
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <SearchBar />
        <RandomAnimeButton />
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
    </div>
  )
}