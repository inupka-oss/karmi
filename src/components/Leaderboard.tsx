'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

interface LeaderboardEntry {
  rank: number
  user_id: string
  nickname: string
  avatar?: string
  level: number
  xp: number
  animeWatched: number
  badges?: string[]
}

const periodTabs = [
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'all', label: 'Всё время' },
]

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [period, setPeriod] = useState('week')
  const [loading, setLoading] = useState(true)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true)
      try {
        // В реальном проекте здесь был бы специальный endpoint для лидеров
        // Для примера загружаем топ пользователей по XP
        const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=*&order=stats->>xp.desc&limit=50`, {
          headers: { 'apikey': supabaseAnonKey },
        })
        if (res.ok) {
          const data = await res.json()
          const entries: LeaderboardEntry[] = data.map((p: any, idx: number) => ({
            rank: idx + 1,
            user_id: p.user_identifier,
            nickname: p.nickname || p.user_identifier.split('@')[0],
            avatar: p.avatar,
            level: p.stats?.level || 1,
            xp: p.stats?.xp || 0,
            animeWatched: p.stats?.animeWatched || 0,
            badges: p.badges || [],
          }))
          setLeaderboard(entries)
        }
      } catch (e) {
        console.error('Load leaderboard error:', e)
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboard()
  }, [period, supabaseUrl, supabaseAnonKey])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50'
      case 2: return 'bg-gradient-to-r from-gray-400/20 to-silver-500/20 border-gray-400/50'
      case 3: return 'bg-gradient-to-r from-amber-700/20 to-bronze-500/20 border-amber-700/50'
      default: return 'border-white/10'
    }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        🏆 Таблица лидеров
      </h2>

      {/* Табы периода */}
      <div className="flex gap-2 mb-6">
        {periodTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPeriod(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              period === tab.id
                ? 'bg-neo-pink text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl animate-pulse">
              <div className="w-8 h-8 bg-white/10 rounded-full" />
              <div className="w-8 h-8 bg-white/10 rounded-full" />
              <div className="flex-1 h-4 bg-white/10 rounded" />
              <div className="w-20 h-4 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          Пока нет данных
        </p>
      ) : (
        <div className="space-y-3">
          {leaderboard.slice(0, 10).map((entry) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-4 p-3 rounded-xl border transition hover:bg-white/5 ${getRankStyle(entry.rank)}`}
            >
              {/* Ранг */}
              <div className="w-8 h-8 flex items-center justify-center text-lg font-bold">
                {getRankIcon(entry.rank)}
              </div>

              {/* Аватар */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neo-pink to-neo-red flex items-center justify-center text-white font-bold flex-shrink-0">
                {entry.avatar ? (
                  <Image src={entry.avatar} alt={entry.nickname} fill className="rounded-full object-cover" />
                ) : (
                  entry.nickname.charAt(0).toUpperCase()
                )}
              </div>

              {/* Информация */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white truncate">{entry.nickname}</span>
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                    ур. {entry.level}
                  </span>
                  {entry.badges?.slice(0, 3).map((badge, idx) => (
                    <span key={idx} className="text-xs">{badge}</span>
                  ))}
                </div>
                <div className="text-xs text-gray-400">
                  {entry.animeWatched} аниме • {entry.xp} XP
                </div>
              </div>

              {/* XP бар */}
              <div className="hidden sm:block w-24">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-neo-pink to-neo-red"
                    style={{ width: `${Math.min((entry.xp % 1000) / 1000 * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {leaderboard.length > 10 && (
        <div className="text-center mt-4">
          <span className="text-gray-400 text-sm">
            Ещё {leaderboard.length - 10} участников
          </span>
        </div>
      )}
    </div>
  )
}
