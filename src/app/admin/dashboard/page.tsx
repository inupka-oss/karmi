import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClientWrapper from '@/components/DashboardClientWrapper'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/admin/login')

  const { data: animeList } = await supabase.from('anime').select('*, genres(name, slug)')
  const { data: genres } = await supabase.from('genres').select('*')

  return <DashboardClientWrapper animeList={animeList || []} genresList={genres || []} />
}