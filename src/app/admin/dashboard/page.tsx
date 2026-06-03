import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminPanel from '@/components/AdminPanel'
import AdminStats from '@/components/AdminStats'
import CommentModeration from '@/components/CommentModeration'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  if (!accessToken) redirect('/admin/login')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Получаем статистику
  const [animeCountRes, episodesCountRes, genresRes, animeRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/anime?select=count`, {
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
    }),
    fetch(`${supabaseUrl}/rest/v1/episodes?select=count`, {
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
    }),
    fetch(`${supabaseUrl}/rest/v1/genres?select=*`, {
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
    }),
    fetch(`${supabaseUrl}/rest/v1/anime?select=*,genres(name,slug)`, {
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
    }),
  ])

  const animeCount = await animeCountRes.json()
  const episodesCount = await episodesCountRes.json()
  const genres = await genresRes.json()
  const animeList = await animeRes.json()

  // Извлекаем числа из ответа Supabase (count)
  const totalAnime = animeCount?.[0]?.count || 0
  const totalEpisodes = episodesCount?.[0]?.count || 0

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { 'Authorization': `Bearer ${accessToken}`, 'apikey': supabaseAnonKey },
  })
  const user = await userRes.json()

  return (
    <div className="space-y-8">
      <AdminStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CommentModeration />
        <AdminPanel userEmail={user.email} stats={{ totalAnime, totalEpisodes }} genres={genres} initialAnime={animeList} />
      </div>
    </div>
  )
}