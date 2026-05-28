import { createServerSupabase } from '@/lib/supabase/server'
import AnimeGrid from '@/components/AnimeGrid'
import SearchBar from '@/components/SearchBar'

export const dynamic = 'force-dynamic'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string; year?: string }>
}) {
  const supabase = await createServerSupabase()
  const sp = await searchParams   // ← вот главное изменение!
  let query = supabase.from('anime').select(`*, genres(name, slug)`)

  if (sp?.q) {
    query = query.or(`title_ru.ilike.%${sp.q}%,title_en.ilike.%${sp.q}%`)
  }
  if (sp?.genre) {
    query = query.filter('genres.slug', 'eq', sp.genre)
  }
  if (sp?.year) {
    query = query.eq('year', parseInt(sp.year))
  }

  const { data: anime } = await query.order('created_at', { ascending: false })

  return (
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto">
      <h1 className="text-5xl md:text-7xl font-bold mb-2 text-glow-white">
  Kar<span className="text-neo-pink text-glow-pink">mi</span>
</h1>
      <SearchBar />
      <AnimeGrid anime={anime || []} />
    </div>
  )
}