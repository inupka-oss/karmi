import { createServerSupabase } from '@/lib/supabase/server'
import AnimeGrid from '@/components/AnimeGrid'

export const dynamic = 'force-dynamic'

export default async function TopPage() {
  const supabase = await createServerSupabase()
  const { data: anime } = await supabase
    .from('anime')
    .select(`*, genres(name, slug)`)
    .order('rating', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-8 text-glow-white">
        🏆 Топ-100 аниме
      </h1>
      <AnimeGrid anime={anime || []} />
    </div>
  )
}