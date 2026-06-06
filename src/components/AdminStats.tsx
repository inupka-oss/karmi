'use client'
import { useState, useEffect } from 'react'

interface SiteStats {
  totalAnime: number
  totalEpisodes: number
  totalUsers: number
  activeUsers: number
  totalViews: number
  totalComments: number
  storageUsed: string
  newAnimeThisMonth: number
  popularAnime: Array<{ id: string; title_ru: string; views: number }>
  recentActivity: Array<{ type: string; description: string; timestamp: string }>
}

export default function AdminStats() {
  const [stats, setStats] = useState<SiteStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      try {
        // Получаем основную статистику
        const [animeRes, episodesRes, usersRes, commentsRes] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/anime?select=id&limit=1`, {
            headers: { 'apikey': supabaseAnonKey, 'Prefer': 'count=exact' },
          }),
          fetch(`${supabaseUrl}/rest/v1/episodes?select=id&limit=1`, {
            headers: { 'apikey': supabaseAnonKey, 'Prefer': 'count=exact' },
          }),
          fetch(`${supabaseUrl}/rest/v1/user_profiles?select=id&limit=1`, {
            headers: { 'apikey': supabaseAnonKey, 'Prefer': 'count=exact' },
          }),
          fetch(`${supabaseUrl}/rest/v1/comments?select=id&limit=1`, {
            headers: { 'apikey': supabaseAnonKey, 'Prefer': 'count=exact' },
          }),
        ])

        const totalAnime = parseInt(animeRes.headers.get('content-range')?.split('/')[1] || '0')
        const totalEpisodes = parseInt(episodesRes.headers.get('content-range')?.split('/')[1] || '0')
        const totalUsers = parseInt(usersRes.headers.get('content-range')?.split('/')[1] || '0')
        const totalComments = parseInt(commentsRes.headers.get('content-range')?.split('/')[1] || '0')

        // Популярное аниме
        const popularRes = await fetch(`${supabaseUrl}/rest/v1/anime?select=id,title_ru,views&order=views.desc&limit=5`, {
          headers: { 'apikey': supabaseAnonKey },
        })
        const popularAnime = popularRes.ok ? await popularRes.json() : []

        // Новые аниме за месяц
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        const newAnimeRes = await fetch(`${supabaseUrl}/rest/v1/anime?select=id&gte=(created_at,${monthAgo.toISOString()})`, {
          headers: { 'apikey': supabaseAnonKey },
        })
        const newAnimeThisMonth = newAnimeRes.ok ? (await newAnimeRes.json()).length : 0

        // Активные пользователи (за последние 7 дней)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const activeUsersRes = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=last_active&gte=(last_active,${weekAgo.toISOString()})`, {
          headers: { 'apikey': supabaseAnonKey },
        })
        const activeUsers = activeUsersRes.ok ? (await activeUsersRes.json()).length : 0

        // Общие просмотры
        const viewsRes = await fetch(`${supabaseUrl}/rest/v1/anime?select=views`, {
          headers: { 'apikey': supabaseAnonKey },
        })
        const viewsData = viewsRes.ok ? await viewsRes.json() : []
        const totalViews = viewsData.reduce((sum: number, a: any) => sum + (a.views || 0), 0)

        setStats({
          totalAnime,
          totalEpisodes,
          totalUsers,
          activeUsers,
          totalViews,
          totalComments,
          storageUsed: '0 GB', // Заглушка, нужно считать отдельно
          newAnimeThisMonth,
          popularAnime,
          recentActivity: [],
        })
      } catch (e) {
        console.error('Load stats error:', e)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [supabaseUrl, supabaseAnonKey])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="glass p-6 rounded-2xl animate-pulse">
            <div className="h-8 bg-white/10 rounded w-16 mb-2" />
            <div className="h-4 bg-white/10 rounded w-24" />
          </div>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Основные метрики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon="🎬" 
          label="Всего аниме" 
          value={stats.totalAnime.toLocaleString()} 
          gradient="from-neo-purple to-neo-purple-light"
        />
        <StatCard 
          icon="📺" 
          label="Всего серий" 
          value={stats.totalEpisodes.toLocaleString()} 
          gradient="from-blue-500 to-purple-500"
        />
        <StatCard 
          icon="👥" 
          label="Пользователи" 
          value={`${stats.totalUsers.toLocaleString()} / ${stats.activeUsers} акт.`} 
          gradient="from-green-500 to-emerald-500"
        />
        <StatCard 
          icon="👁️" 
          label="Просмотры" 
          value={stats.totalViews.toLocaleString()} 
          gradient="from-yellow-500 to-orange-500"
        />
        <StatCard 
          icon="💬" 
          label="Комментарии" 
          value={stats.totalComments.toLocaleString()} 
          gradient="from-pink-500 to-rose-500"
        />
        <StatCard 
          icon="📈" 
          label="Новых за месяц" 
          value={stats.newAnimeThisMonth.toLocaleString()} 
          gradient="from-cyan-500 to-blue-500"
        />
        <StatCard 
          icon="💾" 
          label="Хранилище" 
          value={stats.storageUsed} 
          gradient="from-violet-500 to-purple-500"
        />
        <StatCard 
          icon="🔥" 
          label="Онлайн" 
          value={stats.activeUsers.toLocaleString()} 
          gradient="from-red-500 to-pink-500"
        />
      </div>

      {/* Популярное аниме */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">🔥 Популярное аниме</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Название</th>
                <th className="pb-3 font-medium text-right">Просмотры</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {stats.popularAnime.map((anime, idx) => (
                <tr key={anime.id} className="border-t border-white/10">
                  <td className="py-3">
                    <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-500 text-black' :
                      idx === 1 ? 'bg-gray-400 text-black' :
                      idx === 2 ? 'bg-amber-700 text-white' :
                      'bg-white/10'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3">{anime.title_ru}</td>
                  <td className="py-3 text-right">{anime.views.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Активность */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">📊 Активность</h3>
        <div className="space-y-3">
          <ActivityItem 
            icon="🎬" 
            text={`Добавлено ${stats.newAnimeThisMonth} новых аниме за месяц`} 
          />
          <ActivityItem 
            icon="👥" 
            text={`${stats.activeUsers} активных пользователей за неделю`} 
          />
          <ActivityItem 
            icon="💬" 
            text={`${stats.totalComments} всего комментариев`} 
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  icon, 
  label, 
  value, 
  gradient 
}: { 
  icon: string
  label: string
  value: string | number
  gradient: string
}) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}

function ActivityItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
      <span className="text-2xl">{icon}</span>
      <span className="text-gray-300">{text}</span>
    </div>
  )
}
