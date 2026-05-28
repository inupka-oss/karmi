import { createServerSupabase } from '@/lib/supabase/server'
import Image from 'next/image'
import EpisodeList from '@/components/EpisodeList'

export default async function AnimePage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabase()
  const { data: anime } = await supabase
    .from('anime')
    .select('*, genres(name, slug)')
    .eq('id', params.id)
    .single()

  if (!anime) return <div className="text-center mt-20">Аниме не найдено</div>

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
            <div className="border-l-4 border-neo-pink pl-4 mt-4">
  <p className="text-gray-300 leading-relaxed">{anime.description}</p>
</div>
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
      <EpisodeList animeId={anime.id} />
    </div>
  )
}