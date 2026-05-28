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
  if (!res.ok) throw new Error('Fetch failed')
  return res.json()
}

export default async function AnimePage({ params }: { params: { id: string } }) {
  const animeArray = await fetchSupabase(`anime?id=eq.${params.id}&select=*,genres(name,slug)`)
  const anime = animeArray?.[0]
  if (!anime) notFound()

  const episodes = await fetchSupabase(`episodes?anime_id=eq.${params.id}&order=episode_number.asc`)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 lg:w-1/4">
          <div className="aspect-[3/4] relative rounded-2xl overflow-hidden glass">
            <Image src={anime.poster_url || '/placeholder.jpg'} alt={anime.title_ru} fill className="object-cover" />
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-bold">{anime.title_ru}</h1>
          {anime.title_en && <h2 className="text-xl text-gray-400 mt-1">{anime.title_en}</h2>}
          <div className="flex flex-wrap gap-2 mt-3">
            {anime.genres?.map((g: any) => (
              <span key={g.slug} className="bg-neo-pink/20 text-neo-pink px-3 py-1 rounded-full text-sm">{g.name}</span>
            ))}
          </div>
          <p className="mt-4 text-gray-300 leading-relaxed">{anime.description}</p>
          <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
            <div><span className="text-gray-500">Тип:</span> {anime.type}</div>
            <div><span className="text-gray-500">Год:</span> {anime.year}</div>
            <div><span className="text-gray-500">Рейтинг:</span> {anime.rating}/10</div>
            <div><span className="text-gray-500">Статус:</span> {anime.status}</div>
          </div>
        </div>
      </div>
      <EpisodeList episodes={episodes} />
    </div>
  )
}