import Image from 'next/image'
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
  if (!res.ok) throw new Error(`Supabase error ${res.status}`)
  return res.json()
}

export default async function AnimePage({ params }: { params: { id: string } }) {
  // 1. Получаем аниме
  const animeArray = await fetchSupabase(`anime?id=eq.${params.id}`)
  const anime = animeArray?.[0]
  if (!anime) notFound()

  // 2. Получаем связи аниме-жанр
  const animeGenres = await fetchSupabase(`anime_genres?select=genre_id&anime_id=eq.${anime.id}`)
  const genreIds = animeGenres.map((ag: any) => ag.genre_id)

  // 3. Получаем сами жанры
  let genres: any[] = []
  if (genreIds.length > 0) {
    const idsFilter = genreIds.map((id: number) => `id=eq.${id}`).join('&')
    genres = await fetchSupabase(`genres?or=(${idsFilter})`)
  }

  // 4. Получаем эпизоды
  const episodes = await fetchSupabase(`episodes?anime_id=eq.${anime.id}&order=episode_number.asc`)

  // Прикрепляем жанры к объекту аниме
  const animeWithGenres = { ...anime, genres }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 lg:w-1/4">
          <div className="aspect-[3/4] relative rounded-2xl overflow-hidden glass">
            <Image src={animeWithGenres.poster_url || '/placeholder.jpg'} alt={animeWithGenres.title_ru} fill className="object-cover" />
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-bold">{animeWithGenres.title_ru}</h1>
          {animeWithGenres.title_en && <h2 className="text-xl text-gray-400 mt-1">{animeWithGenres.title_en}</h2>}
          <div className="flex flex-wrap gap-2 mt-3">
            {animeWithGenres.genres.map((g: any) => (
              <span key={g.slug} className="bg-neo-pink/20 text-neo-pink px-3 py-1 rounded-full text-sm">{g.name}</span>
            ))}
          </div>
          <p className="mt-4 text-gray-300 leading-relaxed">{animeWithGenres.description}</p>
          <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
            <div><span className="text-gray-500">Тип:</span> {animeWithGenres.type}</div>
            <div><span className="text-gray-500">Год:</span> {animeWithGenres.year}</div>
            <div><span className="text-gray-500">Рейтинг:</span> {animeWithGenres.rating}/10</div>
            <div><span className="text-gray-500">Статус:</span> {animeWithGenres.status}</div>
          </div>
        </div>
      </div>
      <EpisodeList episodes={episodes} />
    </div>
  )
}