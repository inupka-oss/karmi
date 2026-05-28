import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

const DashboardClient = dynamic<Record<string, never>>(
  () => import('@/components/DashboardClient').then(mod => mod.default),
  { ssr: false, loading: () => <p className="text-white">Загрузка админки...</p> }
)

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/admin/login')

  const { data: animeList } = await supabase.from('anime').select('*, genres(name, slug)')
  const { data: genres } = await supabase.from('genres').select('*')

  return <DashboardClient animeList={animeList || []} genresList={genres || []} />
}