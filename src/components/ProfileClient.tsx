'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
}

interface Stats {
  animeWatched: number
  episodesWatched: number
  hoursWatched: number
  commentsPosted: number
  reviewsWritten: number
  favoritesCount: number
  daysVisited: number
  level: number
  xp: number
  xpToNextLevel: number
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_anime', name: 'Первый шаг', description: 'Посмотреть первое аниме', icon: '🎬', unlocked: false },
  { id: '10_anime', name: 'Опытный', description: 'Посмотреть 10 аниме', icon: '🌟', unlocked: false },
  { id: '50_anime', name: 'Эксперт', description: 'Посмотреть 50 аниме', icon: '⭐', unlocked: false },
  { id: '100_anime', name: 'Легенда', description: 'Посмотреть 100 аниме', icon: '🏆', unlocked: false },
  { id: 'first_comment', name: 'Комментатор', description: 'Оставить первый комментарий', icon: '💬', unlocked: false },
  { id: '10_comments', name: 'Болтун', description: 'Оставить 10 комментариев', icon: '🗣️', unlocked: false },
  { id: 'first_review', name: 'Критик', description: 'Написать первую рецензию', icon: '📝', unlocked: false },
  { id: 'collector', name: 'Коллекционер', description: 'Добавить 20 аниме в избранное', icon: '❤️', unlocked: false },
  { id: 'week_streak', name: 'Неделька', description: 'Посещать сайт 7 дней подряд', icon: '📅', unlocked: false },
  { id: 'month_streak', name: 'Месяц активности', description: 'Посещать сайт 30 дней подряд', icon: '🗓️', unlocked: false },
  { id: 'night_owl', name: 'Сова', description: 'Смотреть аниме после 2 ночи', icon: '🦉', unlocked: false },
  { id: 'marathon', name: 'Марафонец', description: 'Посмотреть 10 серий за день', icon: '🏃', unlocked: false },
]

export default function ProfileClient({ email, accessToken }: { email: string; accessToken: string }) {
  const [nickname, setNickname] = useState(email.split('@')[0])
  const [avatar, setAvatar] = useState('')
  const [bio, setBio] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'achievements'>('profile')
  const router = useRouter()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_identifier=eq.${email}`, {
          headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0) {
            if (data[0].nickname) setNickname(data[0].nickname)
            if (data[0].avatar) setAvatar(data[0].avatar)
            if (data[0].bio) setBio(data[0].bio)
            if (data[0].stats) setStats(data[0].stats)
            if (data[0].achievements) {
              setAchievements(prev => prev.map(a => {
                const unlocked = data[0].achievements.includes(a.id)
                return { ...a, unlocked }
              }))
            }
          }
        }
      } catch (e) {
        console.error('Load profile error:', e)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
    
    // Если есть хэш #friends в URL - скроллим к секции друзей
    if (typeof window !== 'undefined' && window.location.hash === '#friends') {
      setTimeout(() => {
        const friendsSection = document.getElementById('friends')
        if (friendsSection) {
          friendsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 500)
    }
  }, [email, accessToken, supabaseUrl, supabaseAnonKey])

  const handleLogout = () => {
    document.cookie = 'sb-access-token=; path=/; max-age=0'
    document.cookie = 'sb-refresh-token=; path=/; max-age=0'
    localStorage.removeItem('karmi-favorites')
    router.push('/login')
  }

  const handleSave = async () => {
    await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ 
        user_identifier: email, 
        nickname,
        avatar,
        bio,
      }),
    })
    alert('Профиль сохранён!')
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-20 glass p-6 rounded-2xl animate-pulse">
        <div className="h-32 bg-white/10 rounded-xl mb-4" />
        <div className="h-8 bg-white/10 rounded w-48 mb-4" />
        <div className="h-4 bg-white/10 rounded w-64" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4 pb-20">
      {/* Header профиля */}
      <div className="glass rounded-3xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-neo-pink/30 via-purple-500/30 to-blue-500/30" />
        
        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-4 mt-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neo-pink to-neo-red flex items-center justify-center text-4xl font-bold text-white shadow-lg">
            {avatar ? (
              <Image src={avatar} alt={nickname} fill className="rounded-full object-cover" />
            ) : (
              nickname.charAt(0).toUpperCase()
            )}
          </div>
          
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-3xl font-bold text-white">{nickname}</h1>
            <p className="text-gray-400">{email}</p>
            {bio && <p className="text-gray-300 mt-2">{bio}</p>}
          </div>

          {stats && (
            <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-xl">
              <span className="text-yellow-400 text-xl">⭐</span>
              <div>
                <p className="text-white font-bold">Уровень {stats.level}</p>
                <p className="text-xs text-gray-400">{stats.xp} / {stats.xpToNextLevel} XP</p>
              </div>
            </div>
          )}
        </div>

        {/* Прогресс бар уровня */}
        {stats && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Прогресс уровня</span>
              <span>{Math.round((stats.xp / stats.xpToNextLevel) * 100)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-neo-pink to-neo-red transition-all duration-500"
                style={{ width: `${(stats.xp / stats.xpToNextLevel) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Табы */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition ${
            activeTab === 'profile'
              ? 'bg-neo-pink text-white'
              : 'bg-white/10 text-gray-400 hover:text-white'
          }`}
        >
          👤 Профиль
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition ${
            activeTab === 'stats'
              ? 'bg-neo-pink text-white'
              : 'bg-white/10 text-gray-400 hover:text-white'
          }`}
        >
          📊 Статистика
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition ${
            activeTab === 'achievements'
              ? 'bg-neo-pink text-white'
              : 'bg-white/10 text-gray-400 hover:text-white'
          }`}
        >
          🏆 Достижения ({achievements.filter(a => a.unlocked).length}/{achievements.length})
        </button>
      </div>

      {/* Контент табов */}
      {activeTab === 'profile' && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Редактировать профиль</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Никнейм</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Био</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                placeholder="Расскажите о себе..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white resize-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Аватар (URL)</label>
              <input
                type="url"
                value={avatar}
                onChange={e => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={handleSave} className="bg-neo-pink hover:bg-neo-pink/80 text-white px-6 py-2 rounded-xl">
                Сохранить
              </button>
              <button onClick={handleLogout} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 px-6 py-2 rounded-xl">
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard icon="🎬" label="Аниме" value={stats.animeWatched} />
          <StatCard icon="📺" label="Эпизоды" value={stats.episodesWatched} />
          <StatCard icon="⏱️" label="Часов" value={stats.hoursWatched} />
          <StatCard icon="💬" label="Комментарии" value={stats.commentsPosted} />
          <StatCard icon="📝" label="Рецензии" value={stats.reviewsWritten} />
          <StatCard icon="❤️" label="Избранное" value={stats.favoritesCount} />
          <StatCard icon="📅" label="Дней на сайте" value={stats.daysVisited} />
          <StatCard icon="⭐" label="Уровень" value={stats.level} highlight />
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`glass rounded-2xl p-4 transition ${
                achievement.unlocked 
                  ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30' 
                  : 'opacity-50 grayscale'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-4xl">{achievement.icon}</div>
                <div>
                  <h3 className="font-bold text-white">{achievement.name}</h3>
                  <p className="text-sm text-gray-400">{achievement.description}</p>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Получено {new Date(achievement.unlockedAt).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, highlight }: { icon: string; label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-4 text-center ${highlight ? 'bg-neo-pink/10 border-neo-pink/30' : ''}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-neo-pink' : 'text-white'}`}>{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )

  
}