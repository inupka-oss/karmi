import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminPanel from '@/components/AdminPanel'

export const dynamic = 'force-dynamic'

async function fetchSupabase(endpoint: string, accessToken: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Supabase fetch error: ${res.status}`)
  return res.json()
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value

  if (!accessToken) redirect('/admin/login')

  // Получаем пользователя
  const userRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  })
  if (!userRes.ok) redirect('/admin/login')
  const user = await userRes.json()

  // Получаем жанры и аниме
  let genres = [], animeList = []
  try {
    genres = await fetchSupabase('genres?select=*', accessToken)
    // Получаем аниме с жанрами (через join невозможно чистым REST, поэтому получим отдельно)
    const rawAnime = await fetchSupabase('anime?select=*', accessToken)
    // Для каждого аниме получим жанры (можно было бы сделать один запрос с join, но REST не поддерживает вложенные)
    animeList = await Promise.all(
      rawAnime.map(async (a: any) => {
        const animeGenres = await fetchSupabase(
          `anime_genres?select=genre_id&anime_id=eq.${a.id}`,
          accessToken
        )
        const genreIds = animeGenres.map((ag: any) => ag.genre_id)
        const matchedGenres = genres.filter((g: any) => genreIds.includes(g.id))
        return { ...a, genres: matchedGenres }
      })
    )
  } catch (e) {
    console.error('Ошибка загрузки данных:', e)
  }

  return <AdminPanel userEmail={user.email} genres={genres} initialAnime={animeList} />
}