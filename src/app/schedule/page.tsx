import { createServerSupabase } from '@/lib/supabase/server'
import AnimeGrid from '@/components/AnimeGrid'

const DAY_NAMES: Record<number, string> = {
  1: 'Понедельник',
  2: 'Вторник',
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота',
  0: 'Воскресенье',
}

export default async function SchedulePage() {
  const supabase = await createServerSupabase()
  const { data: allAnime } = await supabase
    .from('anime')
    .select(`*, genres(name, slug)`)
    .not('day_of_week', 'is', null)
    .order('day_of_week', { ascending: true })
    .order('title_ru', { ascending: true })

  // Группируем по дням
  const grouped: Record<number, any[]> = {}
  allAnime?.forEach(anime => {
    const day = anime.day_of_week as number
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(anime)
  })

  // Сортируем дни по порядку (1-6,0)
  const sortedDays = Object.keys(grouped).map(Number).sort((a, b) => {
    if (a === 0) return 1
    if (b === 0) return -1
    return a - b
  })

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-8 text-glow-white">
        Расписание выхода серий
      </h1>
      {sortedDays.length === 0 && (
        <p className="text-gray-400">Пока нет аниме с указанным днём выхода.</p>
      )}
      {sortedDays.map(day => (
        <section key={day} className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {DAY_NAMES[day]}
          </h2>
          <AnimeGrid anime={grouped[day]} />
        </section>
      ))}
    </div>
  )
}