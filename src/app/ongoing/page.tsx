import { createServerSupabase } from '@/lib/supabase/server'
import AnimeGrid from '@/components/AnimeGrid'

export const dynamic = 'force-dynamic'

export default async function OngoingPage() {
  const supabase = await createServerSupabase()
  const { data: anime } = await supabase
    .from('anime')
    .select('*, genres(name, slug)')
    .eq('status', 'ongoing')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-glow-white mb-8">Сейчас выходит</h1>
      <AnimeGrid anime={anime || []} />
    </div>
  )
}