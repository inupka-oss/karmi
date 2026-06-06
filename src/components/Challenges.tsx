'use client'
import { useState, useEffect } from 'react'

interface Challenge {
  id: string
  name: string
  description: string
  icon: string
  progress: number
  target: number
  reward: number
  completed: boolean
  expiresAt?: string
  type: 'daily' | 'weekly' | 'seasonal'
}

const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: 'daily_watch',
    name: 'Ежедневный просмотр',
    description: 'Посмотреть 3 серии сегодня',
    icon: '📺',
    progress: 0,
    target: 3,
    reward: 50,
    completed: false,
    type: 'daily',
  },
  {
    id: 'daily_comment',
    name: 'Активный зритель',
    description: 'Оставить 2 комментария',
    icon: '💬',
    progress: 0,
    target: 2,
    reward: 30,
    completed: false,
    type: 'daily',
  },
  {
    id: 'weekly_anime',
    name: 'Исследователь',
    description: 'Начать смотреть 2 новых аниме на этой неделе',
    icon: '🎬',
    progress: 0,
    target: 2,
    reward: 200,
    completed: false,
    type: 'weekly',
  },
  {
    id: 'weekly_rating',
    name: 'Критик',
    description: 'Оценить 5 аниме',
    icon: '⭐',
    progress: 0,
    target: 5,
    reward: 100,
    completed: false,
    type: 'weekly',
  },
  {
    id: 'seasonal_ongoing',
    name: 'В тренде',
    description: 'Смотреть 5 онгоингов этого сезона',
    icon: '🔥',
    progress: 0,
    target: 5,
    reward: 500,
    completed: false,
    type: 'seasonal',
  },
]

export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>(DEFAULT_CHALLENGES)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'daily' | 'weekly' | 'seasonal'>('all')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  useEffect(() => {
    const loadChallenges = async () => {
      // В реальном проекте загружаем прогресс челленджей пользователя
      // Для примера используем дефолтные значения
      setLoading(false)
    }

    loadChallenges()
  }, [supabaseUrl, supabaseAnonKey])

  const getProgressPercent = (challenge: Challenge) => {
    return Math.min((challenge.progress / challenge.target) * 100, 100)
  }

  const filteredChallenges = activeFilter === 'all' 
    ? challenges 
    : challenges.filter(c => c.type === activeFilter)

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          🎯 Челленджи
        </h2>
        <span className="text-sm text-gray-400">
          {challenges.filter(c => c.completed).length}/{challenges.length}
        </span>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {[
          { id: 'all', label: 'Все' },
          { id: 'daily', label: '📅 Ежедневные' },
          { id: 'weekly', label: '📆 Еженедельные' },
          { id: 'seasonal', label: '🌟 Сезонные' },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 hover:scale-105 ${
              activeFilter === filter.id
                ? 'bg-neo-purple text-white shadow-neon'
                : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/15'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-xl animate-pulse">
              <div className="h-4 bg-white/10 rounded w-32 mb-2" />
              <div className="h-3 bg-white/10 rounded w-full mb-2" />
              <div className="h-2 bg-white/10 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredChallenges.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          Нет активных челленджей
        </p>
      ) : (
        <div className="space-y-3">
          {filteredChallenges.map((challenge) => {
            const progress = getProgressPercent(challenge)
            const isCompleted = challenge.completed || progress >= 100

            return (
              <div
                key={challenge.id}
                className={`p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${
                  isCompleted
                    ? 'bg-green-500/10 border-green-500/40'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl flex-shrink-0">{challenge.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white truncate">{challenge.name}</h3>
                      {isCompleted && (
                        <span className="text-green-400 text-sm font-medium ml-2">✓</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{challenge.description}</p>
                    
                    {/* Прогресс бар */}
                    <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-green-400 to-green-600'
                            : 'bg-gradient-to-r from-neo-purple to-neo-purple-light'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">
                        {challenge.progress} / {challenge.target}
                      </span>
                      <span className="text-yellow-400 font-medium">
                        🎁 +{challenge.reward} XP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
