import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import StarRating from '@/components/StarRating'
import CommentSection from '@/components/CommentSection'
import RatingForm from '@/components/RatingForm'
import RelatedAnime from '@/components/RelatedAnime'
import AnimePageClient from '@/components/AnimePageClient'

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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const animeArray = await fetchSupabase(`anime?id=eq.${id}`)
  const anime = animeArray?.[0]
  if (!anime) return { title: 'Аниме не найдено' }
  return {
    title: `${anime.title_ru} — смотреть онлайн бесплатно`,
    description: anime.description?.slice(0, 160) || 'Смотрите аниме на Karmi',
  }
}

export default async function AnimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const animeArray = await fetchSupabase(`anime?id=eq.${id}`)
  const anime = animeArray?.[0]
  if (!anime) notFound()

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

  const episodes = await fetchSupabase(`episodes?anime_id=eq.${anime.id}&order=episode_number.asc`)

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
          <h1 className="text-4xl font-bold text-white">{animeWithGenres.title_ru}</h1>
          {animeWithGenres.title_en && <h2 className="text-xl text-gray-400 mt-1">{animeWithGenres.title_en}</h2>}
          <div className="flex flex-wrap gap-2 mt-3">
            {genres.map((g: any) => (
              <span key={g.slug} className="bg-neo-pink/20 text-neo-pink px-3 py-1 rounded-full text-sm">{g.name}</span>
            ))}
          </div>
          <p className="mt-4 text-gray-300 leading-relaxed">{animeWithGenres.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm text-white">
            <div><span className="text-gray-500">Тип:</span> {animeWithGenres.type}</div>
            <div><span className="text-gray-500">Год:</span> {animeWithGenres.year}</div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Рейтинг:</span>
              <StarRating rating={animeWithGenres.rating || 0} />
            </div>
            <div><span className="text-gray-500">Статус:</span> {animeWithGenres.status}</div>
          </div>
          <RatingForm animeId={anime.id} />

          {(animeWithGenres.studio || animeWithGenres.director || animeWithGenres.cast) && (
            <div className="mt-6 glass p-4 rounded-xl">
              <h2 className="text-lg font-semibold text-white mb-2">Создатели</h2>
              <div className="space-y-1 text-sm text-gray-300">
                {animeWithGenres.studio && <div><span className="text-gray-500">Студия:</span> {animeWithGenres.studio}</div>}
                {animeWithGenres.director && <div><span className="text-gray-500">Режиссёр:</span> {animeWithGenres.director}</div>}
                {animeWithGenres.cast && <div><span className="text-gray-500">Актёры/сэйю:</span> {animeWithGenres.cast}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimePageClient trailerUrl={animeWithGenres.trailer_url} episodes={episodes} />

      <RelatedAnime animeId={anime.id} />
      <CommentSection animeId={anime.id} />
    </div>
  )
}