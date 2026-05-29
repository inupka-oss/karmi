import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function RandomPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const res = await fetch(`${supabaseUrl}/rest/v1/anime?select=id`, {
    headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    return <div className="text-white text-center mt-20">Ошибка загрузки</div>
  }
  const anime: { id: string }[] = await res.json()
  if (anime.length === 0) {
    return <div className="text-white text-center mt-20">Нет аниме в базе</div>
  }
  const randomIndex = Math.floor(Math.random() * anime.length)
  redirect(`/anime/${anime[randomIndex].id}`)
}