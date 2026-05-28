import { notFound } from 'next/navigation'
import EpisodeList from '@/components/EpisodeList'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function fetchSupabase(endpoint: string) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Supabase error ${res.status}: ${res.statusText}`)
  return res.json()
}

export default async function AnimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const animeArray = await fetchSupabase(`anime?id=eq.${id}`)
  const anime = animeArray?.[0]
  if (!anime) notFound()

  // Жанры (с запасным планом)
  const animeGenres = await fetchSupabase(`anime_genres?select=genre_id&anime_id=eq.${anime.id}`)
  const genreIds = animeGenres.map((ag: any) => ag.genre_id)
  let genres: any[] = []
  if (genreIds.length > 0) {
    try {
      genres = await fetchSupabase(`genres?id=in.(${genreIds.join(',')})`)
    } catch {
      const allGenres = await fetchSupabase('genres?select=*')
      genres = allGenres.filter((g: any) => genreIds.includes(g.id))
    }
  }

  // Эпизоды
  const episodes = await fetchSupabase(`episodes?anime_id=eq.${anime.id}&order=episode_number.asc`)

  const animeWithGenres = { ...anime, genres }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold">{animeWithGenres.title_ru}</h1>
      {animeWithGenres.title_en && <h2 className="text-xl text-gray-400 mt-1">{animeWithGenres.title_en}</h2>}
      {genres.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {genres.map((g: any) => (
            <span key={g.slug} className="bg-neo-pink/20 text-neo-pink px-3 py-1 rounded-full text-sm">{g.name}</span>
          ))}
        </div>
      )}
      <p className="mt-4 text-gray-300">{animeWithGenres.description}</p>
      <EpisodeList episodes={episodes} />
    </div>
  )
}