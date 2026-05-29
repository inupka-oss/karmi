import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import StarRating from '@/components/StarRating'
import CommentSection from '@/components/CommentSection'
import RatingForm from '@/components/RatingForm'
import RelatedAnime from '@/components/RelatedAnime'
import AnimeView from '@/components/AnimeView'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function fetchSupabase(endpoint: string) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Supabase error ${res.status}`)
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

  // Увеличиваем счётчик просмотров
  await fetch(`${supabaseUrl}/rest/v1/anime?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ views: (anime.views || 0) + 1 }),
  })

  // Остальные запросы (жанры, эпизоды) без изменений
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

  const animeWithGenres = { ...anime, genres, views: (anime.views || 0) + 1 }

  // Передаём всё в AnimeView
  return <AnimeView anime={animeWithGenres} genres={genres} episodes={episodes} />
}