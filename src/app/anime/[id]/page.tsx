import { notFound } from 'next/navigation'

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
  const animeArray = await fetchSupabase(`anime?id=eq.${params.id}`)
  const anime = animeArray?.[0]
  if (!anime) notFound()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold">{anime.title_ru}</h1>
      <p className="text-gray-400">Тестовая страница: данные загружены успешно!</p>
    </div>
  )
}