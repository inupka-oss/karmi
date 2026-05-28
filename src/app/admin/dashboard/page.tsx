import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/admin/login')

  // Пока не проверяем роль (упрощённо), просто показываем админку
  const { data: animeList } = await supabase.from('anime').select('*, genres(name, slug)')
  const { data: genres } = await supabase.from('genres').select('*')

  return <DashboardClient animeList={animeList || []} genresList={genres || []} />
}