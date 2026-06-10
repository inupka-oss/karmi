'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Settings, BarChart3, Trophy, Target, LogOut, Save,
  Film, Tv, Clock, MessageSquare, BookOpen, Heart, Calendar,
  Star, ChevronDown, ChevronUp, Check, X, Camera, AtSign,
  Zap, Flame, Shield, Crown, Gem, Award, Sparkles, Eye,
  TrendingUp, Users, PartyPopper, Moon, Sun, Gift
} from 'lucide-react'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
  category?: string
}

interface Challenge {
  id: string
  name: string
  description: string
  icon: string
  category: 'daily' | 'weekly' | 'anime' | 'social' | 'special'
  progress: number
  target: number
  reward: string
  completed: boolean
  expiresAt?: string
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

const CHALLENGES: Challenge[] = [
  { id: 'daily_login', name: 'Ежедневный вход', description: 'Зайти на сайт сегодня', icon: '📅', category: 'daily', progress: 0, target: 1, reward: '+10 XP', completed: false },
  { id: 'daily_3ep', name: 'Три серии', description: 'Посмотреть 3 серии за день', icon: '📺', category: 'daily', progress: 0, target: 3, reward: '+25 XP', completed: false },
  { id: 'daily_comment', name: 'Коммент дня', description: 'Оставить комментарий', icon: '💬', category: 'daily', progress: 0, target: 1, reward: '+15 XP', completed: false },
  { id: 'daily_like', name: 'Лайк мастер', description: 'Поставить 5 лайков', icon: '👍', category: 'daily', progress: 0, target: 5, reward: '+10 XP', completed: false },
  { id: 'daily_share', name: 'Поделиться', description: 'Поделиться аниме с другом', icon: '🔗', category: 'daily', progress: 0, target: 1, reward: '+20 XP', completed: false },
  { id: 'daily_favorite', name: 'В избранное', description: 'Добавить аниме в избранное', icon: '❤️', category: 'daily', progress: 0, target: 1, reward: '+10 XP', completed: false },
  { id: 'weekly_7days', name: 'Неделя активности', description: 'Зайти 7 дней подряд', icon: '🗓️', category: 'weekly', progress: 0, target: 7, reward: '+100 XP', completed: false },
  { id: 'weekly_10ep', name: 'Десяточка', description: 'Посмотреть 10 серий за неделю', icon: '🎬', category: 'weekly', progress: 0, target: 10, reward: '+75 XP', completed: false },
  { id: 'weekly_5comments', name: 'Оратор недели', description: '10 комментариев за неделю', icon: '📢', category: 'weekly', progress: 0, target: 10, reward: '+50 XP', completed: false },
  { id: 'weekly_review', name: 'Критик', description: 'Написать рецензию', icon: '📝', category: 'weekly', progress: 0, target: 1, reward: '+100 XP', completed: false },
  { id: 'weekly_friends', name: 'Дружелюбный', description: 'Добавить друга', icon: '🤝', category: 'weekly', progress: 0, target: 1, reward: '+50 XP', completed: false },
  { id: 'weekly_party', name: 'Тусовщик', description: 'Участвовать в Watch Party', icon: '🎉', category: 'weekly', progress: 0, target: 1, reward: '+80 XP', completed: false },
  { id: 'anime_first', name: 'Новичок', description: 'Посмотреть первое аниме', icon: '🌟', category: 'anime', progress: 0, target: 1, reward: '+50 XP', completed: false },
  { id: 'anime_5series', name: 'Пять за раз', description: 'Завершить 5 сериалов', icon: '⭐', category: 'anime', progress: 0, target: 5, reward: '+100 XP', completed: false },
  { id: 'anime_genre', name: 'Исследователь', description: 'Посмотреть 5 жанров', icon: '🎭', category: 'anime', progress: 0, target: 5, reward: '+75 XP', completed: false },
  { id: 'anime_ongoing', name: 'В теме', description: 'Смотреть онгоинг', icon: '📡', category: 'anime', progress: 0, target: 1, reward: '+40 XP', completed: false },
  { id: 'anime_classic', name: 'Классик', description: 'Посмотреть аниме до 2000', icon: '📼', category: 'anime', progress: 0, target: 1, reward: '+60 XP', completed: false },
  { id: 'anime_marathon', name: 'Марафон', description: '10 серий за день', icon: '🏃', category: 'anime', progress: 0, target: 10, reward: '+150 XP', completed: false },
  { id: 'social_friend', name: 'Первый друг', description: 'Добавить первого друга', icon: '👥', category: 'social', progress: 0, target: 1, reward: '+50 XP', completed: false },
  { id: 'social_5friends', name: 'Популярный', description: '5 друзей в профиле', icon: '⭐', category: 'social', progress: 0, target: 5, reward: '+100 XP', completed: false },
  { id: 'social_comment10', name: 'Душа компании', description: '20 комментариев', icon: '🗣️', category: 'social', progress: 0, target: 20, reward: '+80 XP', completed: false },
  { id: 'social_helpful', name: 'Помощник', description: '10 лайков на комментах', icon: '💡', category: 'social', progress: 0, target: 10, reward: '+60 XP', completed: false },
  { id: 'social_party_host', name: 'Организатор', description: 'Создать Watch Party', icon: '🎪', category: 'social', progress: 0, target: 1, reward: '+100 XP', completed: false },
  { id: 'social_invite', name: 'Пригласитель', description: 'Пригласить 3 друзей', icon: '📨', category: 'social', progress: 0, target: 3, reward: '+75 XP', completed: false },
  { id: 'special_birthday', name: 'День рождения', description: 'Зайти в свой ДР', icon: '🎂', category: 'special', progress: 0, target: 1, reward: '+200 XP', completed: false },
  { id: 'special_newyear', name: 'С Новым Годом!', description: 'Зайти 1 января', icon: '🎄', category: 'special', progress: 0, target: 1, reward: '+300 XP', completed: false },
  { id: 'special_night', name: 'Ночной смотр', description: 'Смотреть в 3 ночи', icon: '🌙', category: 'special', progress: 0, target: 1, reward: '+50 XP', completed: false },
  { id: 'special_level10', name: 'Уровень 10', description: 'Достичь 10 уровня', icon: '🔟', category: 'special', progress: 0, target: 1, reward: '+150 XP', completed: false },
  { id: 'special_level50', name: 'Ветеран', description: 'Достичь 50 уровня', icon: '🎖️', category: 'special', progress: 0, target: 1, reward: '+500 XP', completed: false },
  { id: 'special_streak30', name: 'Месяц без пропусков', description: '30 дней подряд', icon: '🔥', category: 'special', progress: 0, target: 30, reward: '+1000 XP', completed: false },
]

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_anime', name: 'Первый шаг', description: 'Посмотреть первое аниме', icon: '🎬', unlocked: false },
  { id: '5_anime', name: 'Новичок', description: 'Посмотреть 5 аниме', icon: '🌱', unlocked: false },
  { id: '10_anime', name: 'Опытный', description: 'Посмотреть 10 аниме', icon: '🌟', unlocked: false },
  { id: '25_anime', name: 'Знаток', description: 'Посмотреть 25 аниме', icon: '✨', unlocked: false },
  { id: '50_anime', name: 'Эксперт', description: 'Посмотреть 50 аниме', icon: '⭐', unlocked: false },
  { id: '75_anime', name: 'Мастер', description: 'Посмотреть 75 аниме', icon: '🌠', unlocked: false },
  { id: '100_anime', name: 'Легенда', description: 'Посмотреть 100 аниме', icon: '🏆', unlocked: false },
  { id: '200_anime', name: 'Грандмастер', description: 'Посмотреть 200 аниме', icon: '👑', unlocked: false },
  { id: '10_episodes', name: 'Начало пути', description: 'Посмотреть 10 серий', icon: '📼', unlocked: false },
  { id: '50_episodes', name: 'Серийный зритель', description: 'Посмотреть 50 серий', icon: '📺', unlocked: false },
  { id: '100_episodes', name: 'Сотка', description: 'Посмотреть 100 серий', icon: '💯', unlocked: false },
  { id: '500_episodes', name: 'Эпический', description: 'Посмотреть 500 серий', icon: '🎭', unlocked: false },
  { id: '1000_episodes', name: 'Тысячник', description: 'Посмотреть 1000 серий', icon: '🔥', unlocked: false },
  { id: 'first_comment', name: 'Комментатор', description: 'Оставить первый комментарий', icon: '💬', unlocked: false },
  { id: '10_comments', name: 'Болтун', description: 'Оставить 10 комментариев', icon: '🗣️', unlocked: false },
  { id: '50_comments', name: 'Оратор', description: 'Оставить 50 комментариев', icon: '📢', unlocked: false },
  { id: '100_comments', name: 'Голос сообщества', description: 'Оставить 100 комментариев', icon: '🎤', unlocked: false },
  { id: 'liked_comment', name: 'Популярный', description: 'Получить 10 лайков на комментарий', icon: '👍', unlocked: false },
  { id: 'first_review', name: 'Критик', description: 'Написать первую рецензию', icon: '📝', unlocked: false },
  { id: '5_reviews', name: 'Рецензент', description: 'Написать 5 рецензий', icon: '📋', unlocked: false },
  { id: '10_reviews', name: 'Эксперт кино', description: 'Написать 10 рецензий', icon: '🎬', unlocked: false },
  { id: '10_favorites', name: 'Ценитель', description: 'Добавить 10 аниме в избранное', icon: '💖', unlocked: false },
  { id: '25_favorites', name: 'Коллекционер', description: 'Добавить 25 аниме в избранное', icon: '❤️', unlocked: false },
  { id: '50_favorites', name: 'Архивариус', description: 'Добавить 50 аниме в избранное', icon: '🏛️', unlocked: false },
  { id: 'first_day', name: 'Первый день', description: 'Посетить сайт в первый раз', icon: '🎉', unlocked: false },
  { id: 'week_streak', name: 'Неделька', description: 'Посещать сайт 7 дней подряд', icon: '📅', unlocked: false },
  { id: 'month_streak', name: 'Месяц активности', description: 'Посещать сайт 30 дней подряд', icon: '🗓️', unlocked: false },
  { id: 'year_streak', name: 'Год вместе', description: 'Посещать сайт 365 дней', icon: '🎊', unlocked: false },
  { id: 'night_owl', name: 'Сова', description: 'Смотреть аниме после 2 ночи', icon: '🦉', unlocked: false },
  { id: 'early_bird', name: 'Жаворонок', description: 'Смотреть аниме до 6 утра', icon: '🌅', unlocked: false },
  { id: 'first_friend', name: 'Новый друг', description: 'Добавить первого друга', icon: '🤝', unlocked: false },
  { id: '5_friends', name: 'Компания', description: 'Иметь 5 друзей', icon: '👥', unlocked: false },
  { id: '10_friends', name: 'Популярный', description: 'Иметь 10 друзей', icon: '⭐', unlocked: false },
  { id: 'watch_party_first', name: 'Первая вечеринка', description: 'Участвовать в Watch Party', icon: '🎬', unlocked: false },
  { id: 'watch_party_host', name: 'Организатор', description: 'Создать 5 Watch Party', icon: '🎪', unlocked: false },
  { id: 'marathon', name: 'Марафонец', description: 'Посмотреть 10 серий за день', icon: '🏃', unlocked: false },
  { id: 'ultra_marathon', name: 'Ультра', description: 'Посмотреть 20 серий за день', icon: '⚡', unlocked: false },
  { id: 'binge_watcher', name: 'Запойный', description: 'Смотреть 5 часов подряд', icon: '🍿', unlocked: false },
  { id: 'level_10', name: 'Уровень 10', description: 'Достичь 10 уровня', icon: '🔟', unlocked: false },
  { id: 'level_50', name: 'Уровень 50', description: 'Достичь 50 уровня', icon: '🎖️', unlocked: false },
  { id: 'level_100', name: 'Максимальный', description: 'Достичь 100 уровня', icon: '💎', unlocked: false },
  { id: 'first_notification', name: 'Подписчик', description: 'Подписаться на первое аниме', icon: '🔔', unlocked: false },
  { id: 'completionist', name: 'Завершитель', description: 'Получить 25 достижений', icon: '🏅', unlocked: false },
  { id: 'legend', name: 'Легенда KarMi', description: 'Получить все достижения', icon: '👻', unlocked: false },
]

// Map emoji icons to Lucide icons
function getAchievementLucideIcon(icon: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    '🎬': <Film className="w-5 h-5" />,
    '🌱': <Sparkles className="w-5 h-5" />,
    '🌟': <Star className="w-5 h-5" />,
    '✨': <Sparkles className="w-5 h-5" />,
    '⭐': <Star className="w-5 h-5" />,
    '🌠': <Star className="w-5 h-5" />,
    '🏆': <Trophy className="w-5 h-5" />,
    '👑': <Crown className="w-5 h-5" />,
    '📼': <Film className="w-5 h-5" />,
    '📺': <Tv className="w-5 h-5" />,
    '💯': <Target className="w-5 h-5" />,
    '🎭': <Eye className="w-5 h-5" />,
    '🔥': <Flame className="w-5 h-5" />,
    '💬': <MessageSquare className="w-5 h-5" />,
    '🗣️': <MessageSquare className="w-5 h-5" />,
    '📢': <MessageSquare className="w-5 h-5" />,
    '🎤': <MessageSquare className="w-5 h-5" />,
    '👍': <Star className="w-5 h-5" />,
    '📝': <BookOpen className="w-5 h-5" />,
    '📋': <BookOpen className="w-5 h-5" />,
    '💖': <Heart className="w-5 h-5" />,
    '❤️': <Heart className="w-5 h-5" />,
    '🏛️': <Shield className="w-5 h-5" />,
    '🎉': <PartyPopper className="w-5 h-5" />,
    '📅': <Calendar className="w-5 h-5" />,
    '🗓️': <Calendar className="w-5 h-5" />,
    '🎊': <PartyPopper className="w-5 h-5" />,
    '🦉': <Moon className="w-5 h-5" />,
    '🌅': <Sun className="w-5 h-5" />,
    '🤝': <Users className="w-5 h-5" />,
    '👥': <Users className="w-5 h-5" />,
    '🎪': <PartyPopper className="w-5 h-5" />,
    '🏃': <Zap className="w-5 h-5" />,
    '⚡': <Zap className="w-5 h-5" />,
    '🍿': <Eye className="w-5 h-5" />,
    '🔟': <Gem className="w-5 h-5" />,
    '🎖️': <Award className="w-5 h-5" />,
    '💎': <Gem className="w-5 h-5" />,
    '🔔': <Gift className="w-5 h-5" />,
    '🏅': <Award className="w-5 h-5" />,
    '👻': <Sparkles className="w-5 h-5" />,
  }
  return iconMap[icon] || <Star className="w-5 h-5" />
}

function getChallengeLucideIcon(icon: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    '📅': <Calendar className="w-5 h-5" />,
    '📺': <Tv className="w-5 h-5" />,
    '💬': <MessageSquare className="w-5 h-5" />,
    '👍': <Star className="w-5 h-5" />,
    '🔗': <Zap className="w-5 h-5" />,
    '❤️': <Heart className="w-5 h-5" />,
    '🗓️': <Calendar className="w-5 h-5" />,
    '🎬': <Film className="w-5 h-5" />,
    '📢': <MessageSquare className="w-5 h-5" />,
    '📝': <BookOpen className="w-5 h-5" />,
    '🤝': <Users className="w-5 h-5" />,
    '🎉': <PartyPopper className="w-5 h-5" />,
    '🌟': <Star className="w-5 h-5" />,
    '⭐': <Star className="w-5 h-5" />,
    '🎭': <Eye className="w-5 h-5" />,
    '📡': <Tv className="w-5 h-5" />,
    '📼': <Film className="w-5 h-5" />,
    '🏃': <Zap className="w-5 h-5" />,
    '👥': <Users className="w-5 h-5" />,
    '🗣️': <MessageSquare className="w-5 h-5" />,
    '💡': <Star className="w-5 h-5" />,
    '🎪': <PartyPopper className="w-5 h-5" />,
    '📨': <Gift className="w-5 h-5" />,
    '🎂': <Gift className="w-5 h-5" />,
    '🎄': <Gift className="w-5 h-5" />,
    '🌙': <Moon className="w-5 h-5" />,
    '🔟': <Gem className="w-5 h-5" />,
    '🎖️': <Award className="w-5 h-5" />,
    '🔥': <Flame className="w-5 h-5" />,
  }
  return iconMap[icon] || <Target className="w-5 h-5" />
}

const TABS = [
  { id: 'profile' as const, label: 'Профиль', icon: User },
  { id: 'stats' as const, label: 'Статистика', icon: BarChart3 },
  { id: 'achievements' as const, label: 'Достижения', icon: Trophy },
  { id: 'challenges' as const, label: 'Челленджи', icon: Target },
]

const CHALLENGE_CATEGORIES = [
  { key: 'daily', label: 'Ежедневные', icon: Calendar },
  { key: 'weekly', label: 'Еженедельные', icon: Clock },
  { key: 'anime', label: 'Аниме', icon: Film },
  { key: 'social', label: 'Социальные', icon: Users },
  { key: 'special', label: 'Особые', icon: Sparkles },
] as const

export default function ProfileClient({ email, accessToken }: { email: string; accessToken: string }) {
  const [nickname, setNickname] = useState(email.split('@')[0])
  const [username, setUsername] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [avatar, setAvatar] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [bio, setBio] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS)
  const [loading, setLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'achievements' | 'challenges'>('profile')
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [saving, setSaving] = useState(false)
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'unlocked' | 'locked'>('all')
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
            if (data[0].username) setUsername(data[0].username)
            if (data[0].avatar) setAvatar(data[0].avatar)
            if (data[0].bio) setBio(data[0].bio)
            if (data[0].stats) setStats(data[0].stats)
            if (data[0].achievements) {
              setAchievements(prev => prev.map(a => {
                const unlocked = data[0].achievements.includes(a.id)
                return { ...a, unlocked }
              }))
            }
            if (data[0].challenges) {
              setChallenges(prev => prev.map(c => {
                const saved = data[0].challenges.find((s: any) => s.id === c.id)
                if (saved) {
                  return { ...c, progress: saved.progress, completed: saved.completed }
                }
                return c
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

  useEffect(() => {
    if (!stats) return
    setAchievements(prev => prev.map(a => {
      if (a.unlocked) return a
      let shouldUnlock = false
      if (a.id === 'first_anime' && stats.animeWatched >= 1) shouldUnlock = true
      if (a.id === '5_anime' && stats.animeWatched >= 5) shouldUnlock = true
      if (a.id === '10_anime' && stats.animeWatched >= 10) shouldUnlock = true
      if (a.id === '25_anime' && stats.animeWatched >= 25) shouldUnlock = true
      if (a.id === '50_anime' && stats.animeWatched >= 50) shouldUnlock = true
      if (a.id === '75_anime' && stats.animeWatched >= 75) shouldUnlock = true
      if (a.id === '100_anime' && stats.animeWatched >= 100) shouldUnlock = true
      if (a.id === '200_anime' && stats.animeWatched >= 200) shouldUnlock = true
      if (a.id === '10_episodes' && stats.episodesWatched >= 10) shouldUnlock = true
      if (a.id === '50_episodes' && stats.episodesWatched >= 50) shouldUnlock = true
      if (a.id === '100_episodes' && stats.episodesWatched >= 100) shouldUnlock = true
      if (a.id === '500_episodes' && stats.episodesWatched >= 500) shouldUnlock = true
      if (a.id === '1000_episodes' && stats.episodesWatched >= 1000) shouldUnlock = true
      if (a.id === 'first_comment' && stats.commentsPosted >= 1) shouldUnlock = true
      if (a.id === '10_comments' && stats.commentsPosted >= 10) shouldUnlock = true
      if (a.id === '50_comments' && stats.commentsPosted >= 50) shouldUnlock = true
      if (a.id === '100_comments' && stats.commentsPosted >= 100) shouldUnlock = true
      if (a.id === 'first_review' && stats.reviewsWritten >= 1) shouldUnlock = true
      if (a.id === '5_reviews' && stats.reviewsWritten >= 5) shouldUnlock = true
      if (a.id === '10_reviews' && stats.reviewsWritten >= 10) shouldUnlock = true
      if (a.id === '10_favorites' && stats.favoritesCount >= 10) shouldUnlock = true
      if (a.id === '25_favorites' && stats.favoritesCount >= 25) shouldUnlock = true
      if (a.id === '50_favorites' && stats.favoritesCount >= 50) shouldUnlock = true
      if (a.id === 'first_day' && stats.daysVisited >= 1) shouldUnlock = true
      if (a.id === 'week_streak' && stats.daysVisited >= 7) shouldUnlock = true
      if (a.id === 'month_streak' && stats.daysVisited >= 30) shouldUnlock = true
      if (a.id === 'year_streak' && stats.daysVisited >= 365) shouldUnlock = true
      if (a.id === 'level_10' && stats.level >= 10) shouldUnlock = true
      if (a.id === 'level_50' && stats.level >= 50) shouldUnlock = true
      if (a.id === 'level_100' && stats.level >= 100) shouldUnlock = true
      const unlockedCount = prev.filter(x => x.unlocked).length
      if (a.id === 'completionist' && unlockedCount >= 25) shouldUnlock = true
      return shouldUnlock ? { ...a, unlocked: true } : a
    }))
  }, [stats])

  useEffect(() => {
    if (!stats) return
    setChallenges(prev => prev.map(c => {
      if (c.completed) return c
      let newProgress = c.progress
      if (c.id === 'daily_login') { newProgress = 1 }
      if (c.id === 'daily_3ep' && stats.episodesWatched >= 3) { newProgress = 3 }
      if (c.id === 'daily_comment' && stats.commentsPosted >= 1) { newProgress = 1 }
      if (c.id === 'daily_like') { newProgress = Math.min(stats.episodesWatched, 5) }
      if (c.id === 'daily_favorite' && stats.favoritesCount >= 1) { newProgress = 1 }
      if (c.id === 'weekly_7days') { newProgress = Math.min(stats.episodesWatched, 7) }
      if (c.id === 'weekly_10ep' && stats.episodesWatched >= 10) { newProgress = 10 }
      if (c.id === 'weekly_5comments' && stats.commentsPosted >= 10) { newProgress = 10 }
      if (c.id === 'weekly_review') { newProgress = 1 }
      if (c.id === 'anime_first' && stats.animeWatched >= 1) { newProgress = 1 }
      if (c.id === 'anime_5series' && stats.animeWatched >= 5) { newProgress = 5 }
      if (c.id === 'anime_marathon' && stats.episodesWatched >= 10) { newProgress = 10 }
      if (c.id === 'social_friend') { newProgress = Math.min(stats.favoritesCount, 1) }
      if (c.id === 'social_5friends') { newProgress = Math.min(stats.favoritesCount, 5) }
      if (c.id === 'social_comment10' && stats.commentsPosted >= 20) { newProgress = 20 }
      if (c.id === 'special_level10' && stats.level >= 10) { newProgress = 1 }
      if (c.id === 'special_level50' && stats.level >= 50) { newProgress = 1 }
      if (c.id === 'special_streak30') { newProgress = Math.min(stats.episodesWatched, 30) }
      const completed = newProgress >= c.target
      return { ...c, progress: newProgress, completed }
    }))
  }, [stats])

  const uploadAvatar = async (file: File): Promise<string> => {
    setUploadingAvatar(true)
    try {
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const ext = file.name.split('.').pop() || 'jpg'
      const safeName = `avatar_${email.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${random}.${ext}`
      const uploadUrl = `${supabaseUrl}/storage/v1/object/avatars/${safeName}`
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${safeName}`
      const formData = new FormData()
      formData.append('', file)
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}` },
        body: formData,
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(errorData.message || `Upload failed: ${res.status}`)
      }
      return publicUrl
    } catch (e: any) {
      alert(`Ошибка загрузки аватарки: ${e.message || 'Неизвестная ошибка'}`)
      return avatar
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Файл слишком большой (макс 5MB)'); return }
    if (!file.type.startsWith('image/')) { alert('Выберите изображение'); return }
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
    setAvatarFile(file)
  }

  const checkUsernameAvailability = async (value: string) => {
    if (!value || value.length < 3) { setUsernameAvailable(null); return }
    const validPattern = /^[a-zA-Z0-9_]+$/
    if (!validPattern.test(value)) { setUsernameAvailable(false); return }
    setCheckingUsername(true)
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/check_username_available`, {
        method: 'POST',
        headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_username: value }),
      })
      if (res.ok) { setUsernameAvailable(await res.json()) }
    } catch (e) { console.error('Check username error:', e) }
    finally { setCheckingUsername(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let finalAvatar = avatar
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile)
        if (uploadedUrl && uploadedUrl !== avatar) { finalAvatar = uploadedUrl }
      }
      if (username && username.length < 3) { alert('Username должен быть не менее 3 символов'); return }
      if (username && !/^[a-zA-Z0-9_]+$/.test(username)) { alert('Username может содержать только латиницу, цифры и _'); return }
      const saveData: any = { user_identifier: email, nickname, avatar: finalAvatar, bio }
      if (username) saveData.username = username
      const completedChallenges = challenges.filter(c => c.completed).map(c => ({ id: c.id, progress: c.progress, completed: true }))
      if (completedChallenges.length > 0) saveData.challenges = completedChallenges
      const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${accessToken}`, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(saveData),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        alert(`Ошибка сохранения: ${res.status}\n${errorData.message || errorData.hint || ''}`)
        return
      }
      const savedData = await res.json().catch(() => ({}))
      if (savedData[0]?.username) setUsername(savedData[0].username)
      if (savedData[0]?.avatar) setAvatar(savedData[0].avatar)
      if (savedData[0]?.nickname) setNickname(savedData[0].nickname)
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
      setAvatarFile(null)
      setAvatarPreview('')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-20 px-4">
        <div className="glass rounded-3xl p-8 animate-pulse">
          <div className="flex flex-col items-center gap-6">
            <div className="w-28 h-28 rounded-full bg-white/10" />
            <div className="h-8 bg-white/10 rounded w-48" />
            <div className="h-4 bg-white/10 rounded w-32" />
          </div>
        </div>
      </div>
    )
  }

  const xpPercent = stats ? Math.round((stats.xp / stats.xpToNextLevel) * 100) : 0
  const unlockedAchievements = achievements.filter(a => a.unlocked).length
  const completedChallenges = challenges.filter(c => c.completed).length

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      {/* Hero Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative mt-8 mb-8"
      >
        {/* Glow background */}
        <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-neo-purple/30 via-purple-500/20 to-neo-pink/30 blur-xl opacity-60" />
        
        <div className="relative glass rounded-[2rem] p-6 sm:p-8 overflow-hidden">
          {/* Decorative gradient orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-neo-purple/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-neo-pink/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-neo-purple to-neo-pink rounded-full opacity-75 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-neo-purple to-neo-purple-light flex items-center justify-center text-4xl font-bold text-white overflow-hidden ring-2 ring-white/20">
                {avatarPreview || avatar ? (
                  <img src={avatarPreview || avatar} alt={nickname} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl sm:text-4xl">{nickname.charAt(0).toUpperCase()}</span>
                )}
              </div>
              {stats && (
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-lg">
                  <Crown className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-bold text-white">{stats.level}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{nickname}</h1>
                {username && (
                  <span className="text-sm text-neo-purple-light bg-neo-purple/20 px-2 py-0.5 rounded-full">@{username}</span>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-1">{email}</p>
              {bio && <p className="text-gray-300 mt-2 text-sm max-w-md">{bio}</p>}
              
              {/* XP Progress */}
              {stats && (
                <div className="mt-4 max-w-sm">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span className="text-white font-semibold">{stats.xp}</span>
                      <span>/ {stats.xpToNextLevel} XP</span>
                    </div>
                    <span className="text-neo-purple-light font-medium">{xpPercent}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${xpPercent}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                      className="h-full bg-gradient-to-r from-neo-purple to-neo-pink rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            {stats && (
              <div className="flex gap-4 sm:gap-6">
                <QuickStat icon={<Film className="w-4 h-4" />} value={stats.animeWatched} label="Аниме" />
                <QuickStat icon={<Tv className="w-4 h-4" />} value={stats.episodesWatched} label="Серий" />
                <QuickStat icon={<Clock className="w-4 h-4" />} value={stats.hoursWatched} label="Часов" />
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 glass rounded-2xl overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-1 justify-center ${
                isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white/70'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-neo-purple to-neo-pink rounded-xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-neo-purple-light" />
              Редактировать профиль
            </h2>
            <div className="space-y-5">
              {/* Username */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5" /> Username
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); checkUsernameAvailability(e.target.value) }}
                    placeholder="@username"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neo-purple/50 focus:ring-1 focus:ring-neo-purple/30 transition-all"
                    pattern="[a-zA-Z0-9_]+"
                    minLength={3}
                    maxLength={20}
                  />
                  <div className="flex items-center justify-center w-10">
                    {checkingUsername && <span className="text-gray-400 text-xs">⏳</span>}
                    {!checkingUsername && username && username.length >= 3 && usernameAvailable === true && (
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      </div>
                    )}
                    {!checkingUsername && username && username.length >= 3 && usernameAvailable === false && (
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Только латиница, цифры и _ (3-20 символов)</p>
              </div>

              {/* Nickname */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Никнейм
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neo-purple/50 focus:ring-1 focus:ring-neo-purple/30 transition-all"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Био
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  placeholder="Расскажите о себе..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-neo-purple/50 focus:ring-1 focus:ring-neo-purple/30 transition-all"
                />
              </div>

              {/* Avatar */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Аватар
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    disabled={uploadingAvatar}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neo-purple/20 file:text-neo-purple-light hover:file:bg-neo-purple/30 transition-all"
                  />
                  {uploadingAvatar && <p className="text-xs text-neo-purple-light flex items-center gap-1.5"><span className="animate-spin">⏳</span> Загрузка...</p>}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                    <div className="relative flex justify-center text-xs"><span className="px-2 bg-neo-dark text-gray-500">или через URL</span></div>
                  </div>
                  <input
                    type="url"
                    value={avatar}
                    onChange={e => setAvatar(e.target.value)}
                    placeholder="https://..."
                    disabled={!!avatarFile}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm disabled:opacity-50 focus:outline-none focus:border-neo-purple/50 focus:ring-1 focus:ring-neo-purple/30 transition-all"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-neo-purple to-neo-pink hover:from-neo-purple-dark hover:to-neo-pink text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 px-6 py-3 rounded-xl font-medium transition-all duration-200 border border-white/10 hover:border-red-500/30"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {[
              { icon: Film, label: 'Аниме', value: stats.animeWatched, color: 'from-purple-500/20 to-violet-500/20', iconColor: 'text-purple-400' },
              { icon: Tv, label: 'Эпизоды', value: stats.episodesWatched, color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-400' },
              { icon: Clock, label: 'Часов', value: stats.hoursWatched, color: 'from-orange-500/20 to-amber-500/20', iconColor: 'text-orange-400' },
              { icon: MessageSquare, label: 'Комментарии', value: stats.commentsPosted, color: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-green-400' },
              { icon: BookOpen, label: 'Рецензии', value: stats.reviewsWritten, color: 'from-pink-500/20 to-rose-500/20', iconColor: 'text-pink-400' },
              { icon: Heart, label: 'Избранное', value: stats.favoritesCount, color: 'from-red-500/20 to-rose-500/20', iconColor: 'text-red-400' },
              { icon: Calendar, label: 'Дней на сайте', value: stats.daysVisited, color: 'from-teal-500/20 to-cyan-500/20', iconColor: 'text-teal-400' },
              { icon: Star, label: 'Уровень', value: stats.level, color: 'from-yellow-500/20 to-amber-500/20', iconColor: 'text-yellow-400', highlight: true },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`glass rounded-2xl p-4 sm:p-5 text-center bg-gradient-to-br ${stat.color} border border-white/5 hover:border-white/10 transition-all duration-200 hover:scale-[1.02]`}
              >
                <div className={`w-10 h-10 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center ${stat.iconColor}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className={`text-2xl sm:text-3xl font-bold ${stat.highlight ? 'bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent' : 'text-white'}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Progress */}
            <div className="glass rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  Прогресс: {unlockedAchievements}/{achievements.length}
                </h3>
                <span className="text-neo-purple-light text-sm font-semibold">{Math.round((unlockedAchievements / achievements.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(unlockedAchievements / achievements.length) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4">
              {[
                { key: 'all', label: `Все (${achievements.length})` },
                { key: 'unlocked', label: `Разблокировано (${unlockedAchievements})` },
                { key: 'locked', label: `Закрыто (${achievements.length - unlockedAchievements})` },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setAchievementFilter(f.key as typeof achievementFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    achievementFilter === f.key
                      ? 'bg-neo-purple/20 text-neo-purple-light border border-neo-purple/30'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {achievements
                .filter(a => {
                  if (achievementFilter === 'unlocked') return a.unlocked
                  if (achievementFilter === 'locked') return !a.unlocked
                  return true
                })
                .map((achievement, i) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  className={`glass rounded-xl p-4 border transition-all duration-200 hover:scale-[1.02] ${
                    achievement.unlocked
                      ? 'border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5'
                      : 'border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      achievement.unlocked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-gray-500'
                    }`}>
                      {getAchievementLucideIcon(achievement.icon)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-sm truncate">{achievement.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{achievement.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <motion.div
            key="challenges"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Progress */}
            <div className="glass rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-neo-purple-light" />
                  Выполнено: {completedChallenges}/{challenges.length}
                </h3>
                <span className="text-neo-purple-light text-sm font-semibold">{Math.round((completedChallenges / challenges.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedChallenges / challenges.length) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-neo-purple to-neo-pink rounded-full"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-6">
              {CHALLENGE_CATEGORIES.map((cat) => {
                const catChallenges = challenges.filter(c => c.category === cat.key)
                const catCompleted = catChallenges.filter(c => c.completed).length
                return (
                  <ChallengeCategorySection
                    key={cat.key}
                    title={cat.label}
                    Icon={cat.icon}
                    challenges={catChallenges}
                    completedCount={catCompleted}
                  />
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function QuickStat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-xl sm:text-2xl font-bold text-white">{value}</div>
      <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
        {icon} {label}
      </div>
    </div>
  )
}

function ChallengeCategorySection({
  title,
  Icon,
  challenges,
  completedCount,
  maxShow = 3,
}: {
  title: string
  Icon: React.ComponentType<{ className?: string }>
  challenges: Challenge[]
  completedCount: number
  maxShow?: number
}) {
  const [showAll, setShowAll] = useState(false)
  const displayed = showAll ? challenges : challenges.slice(0, maxShow)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Icon className="w-4 h-4 text-neo-purple-light" />
          {title}
        </h3>
        <span className="text-xs text-gray-400">{completedCount}/{challenges.length}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayed.map((challenge, i) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
            className={`glass rounded-xl p-4 border transition-all duration-200 hover:scale-[1.02] ${
              challenge.completed
                ? 'border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5'
                : 'border-white/5'
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                challenge.completed ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'
              }`}>
                {getChallengeLucideIcon(challenge.icon)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-sm truncate">{challenge.name}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{challenge.description}</p>
              </div>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-gray-400">Прогресс</span>
                <span className={challenge.completed ? 'text-green-400' : 'text-neo-purple-light'}>
                  {challenge.progress}/{challenge.target}
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    challenge.completed
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-neo-purple to-neo-purple-light'
                  }`}
                  style={{ width: `${Math.min((challenge.progress / challenge.target) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className={`text-[10px] font-semibold flex items-center gap-1 ${
              challenge.completed ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {challenge.completed ? <Check className="w-3 h-3" /> : <Gift className="w-3 h-3" />}
              {challenge.reward}
            </div>
          </motion.div>
        ))}
      </div>

      {challenges.length > maxShow && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-neo-purple-light hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
        >
          {showAll ? 'Свернуть' : `Показать все (${challenges.length})`}
          {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}
    </div>
  )
}