'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
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
  // 📅 Ежедневные (6)
  { id: 'daily_login', name: 'Ежедневный вход', description: 'Зайти на сайт сегодня', icon: '📅', category: 'daily', progress: 0, target: 1, reward: '+10 XP', completed: false },
  { id: 'daily_3ep', name: 'Три серии', description: 'Посмотреть 3 серии за день', icon: '📺', category: 'daily', progress: 0, target: 3, reward: '+25 XP', completed: false },
  { id: 'daily_comment', name: 'Коммент дня', description: 'Оставить комментарий', icon: '💬', category: 'daily', progress: 0, target: 1, reward: '+15 XP', completed: false },
  { id: 'daily_like', name: 'Лайк мастер', description: 'Поставить 5 лайков', icon: '👍', category: 'daily', progress: 0, target: 5, reward: '+10 XP', completed: false },
  { id: 'daily_share', name: 'Поделиться', description: 'Поделиться аниме с другом', icon: '🔗', category: 'daily', progress: 0, target: 1, reward: '+20 XP', completed: false },
  { id: 'daily_favorite', name: 'В избранное', description: 'Добавить аниме в избранное', icon: '❤️', category: 'daily', progress: 0, target: 1, reward: '+10 XP', completed: false },
  
  // 📆 Еженедельные (6)
  { id: 'weekly_7days', name: 'Неделя активности', description: 'Зайти 7 дней подряд', icon: '🗓️', category: 'weekly', progress: 0, target: 7, reward: '+100 XP', completed: false },
  { id: 'weekly_10ep', name: 'Десяточка', description: 'Посмотреть 10 серий за неделю', icon: '🎬', category: 'weekly', progress: 0, target: 10, reward: '+75 XP', completed: false },
  { id: 'weekly_5comments', name: 'Оратор недели', description: '10 комментариев за неделю', icon: '📢', category: 'weekly', progress: 0, target: 10, reward: '+50 XP', completed: false },
  { id: 'weekly_review', name: 'Критик', description: 'Написать рецензию', icon: '📝', category: 'weekly', progress: 0, target: 1, reward: '+100 XP', completed: false },
  { id: 'weekly_friends', name: 'Дружелюбный', description: 'Добавить друга', icon: '🤝', category: 'weekly', progress: 0, target: 1, reward: '+50 XP', completed: false },
  { id: 'weekly_party', name: 'Тусовщик', description: 'Участвовать в Watch Party', icon: '🎉', category: 'weekly', progress: 0, target: 1, reward: '+80 XP', completed: false },
  
  // 🎬 Аниме челленджи (6)
  { id: 'anime_first', name: 'Новичок', description: 'Посмотреть первое аниме', icon: '🌟', category: 'anime', progress: 0, target: 1, reward: '+50 XP', completed: false },
  { id: 'anime_5series', name: 'Пять за раз', description: 'Завершить 5 сериалов', icon: '⭐', category: 'anime', progress: 0, target: 5, reward: '+100 XP', completed: false },
  { id: 'anime_genre', name: 'Исследователь', description: 'Посмотреть 5 жанров', icon: '🎭', category: 'anime', progress: 0, target: 5, reward: '+75 XP', completed: false },
  { id: 'anime_ongoing', name: 'В теме', description: 'Смотреть онгоинг', icon: '📡', category: 'anime', progress: 0, target: 1, reward: '+40 XP', completed: false },
  { id: 'anime_classic', name: 'Классик', description: 'Посмотреть аниме до 2000', icon: '📼', category: 'anime', progress: 0, target: 1, reward: '+60 XP', completed: false },
  { id: 'anime_marathon', name: 'Марафон', description: '10 серий за день', icon: '🏃', category: 'anime', progress: 0, target: 10, reward: '+150 XP', completed: false },
  
  // 👥 Социальные (6)
  { id: 'social_friend', name: 'Первый друг', description: 'Добавить первого друга', icon: '👥', category: 'social', progress: 0, target: 1, reward: '+50 XP', completed: false },
  { id: 'social_5friends', name: 'Популярный', description: '5 друзей в профиле', icon: '⭐', category: 'social', progress: 0, target: 5, reward: '+100 XP', completed: false },
  { id: 'social_comment10', name: 'Душа компании', description: '20 комментариев', icon: '🗣️', category: 'social', progress: 0, target: 20, reward: '+80 XP', completed: false },
  { id: 'social_helpful', name: 'Помощник', description: '10 лайков на комментах', icon: '💡', category: 'social', progress: 0, target: 10, reward: '+60 XP', completed: false },
  { id: 'social_party_host', name: 'Организатор', description: 'Создать Watch Party', icon: '🎪', category: 'social', progress: 0, target: 1, reward: '+100 XP', completed: false },
  { id: 'social_invite', name: 'Пригласитель', description: 'Пригласить 3 друзей', icon: '📨', category: 'social', progress: 0, target: 3, reward: '+75 XP', completed: false },
  
  // 🎯 Особые (6)
  { id: 'special_birthday', name: 'День рождения', description: 'Зайти в свой ДР', icon: '🎂', category: 'special', progress: 0, target: 1, reward: '+200 XP', completed: false },
  { id: 'special_newyear', name: 'С Новым Годом!', description: 'Зайти 1 января', icon: '🎄', category: 'special', progress: 0, target: 1, reward: '+300 XP', completed: false },
  { id: 'special_night', name: 'Ночной смотр', description: 'Смотреть в 3 ночи', icon: '🌙', category: 'special', progress: 0, target: 1, reward: '+50 XP', completed: false },
  { id: 'special_level10', name: 'Уровень 10', description: 'Достичь 10 уровня', icon: '🔟', category: 'special', progress: 0, target: 1, reward: '+150 XP', completed: false },
  { id: 'special_level50', name: 'Ветеран', description: 'Достичь 50 уровня', icon: '🎖️', category: 'special', progress: 0, target: 1, reward: '+500 XP', completed: false },
  { id: 'special_streak30', name: 'Месяц без пропусков', description: '30 дней подряд', icon: '🔥', category: 'special', progress: 0, target: 30, reward: '+1000 XP', completed: false },
]

const ACHIEVEMENTS: Achievement[] = [
  // 🎬 Просмотр аниме
  { id: 'first_anime', name: 'Первый шаг', description: 'Посмотреть первое аниме', icon: '🎬', unlocked: false },
  { id: '5_anime', name: 'Новичок', description: 'Посмотреть 5 аниме', icon: '🌱', unlocked: false },
  { id: '10_anime', name: 'Опытный', description: 'Посмотреть 10 аниме', icon: '🌟', unlocked: false },
  { id: '25_anime', name: 'Знаток', description: 'Посмотреть 25 аниме', icon: '✨', unlocked: false },
  { id: '50_anime', name: 'Эксперт', description: 'Посмотреть 50 аниме', icon: '⭐', unlocked: false },
  { id: '75_anime', name: 'Мастер', description: 'Посмотреть 75 аниме', icon: '🌠', unlocked: false },
  { id: '100_anime', name: 'Легенда', description: 'Посмотреть 100 аниме', icon: '🏆', unlocked: false },
  { id: '200_anime', name: 'Грандмастер', description: 'Посмотреть 200 аниме', icon: '👑', unlocked: false },
  
  // 📺 Эпизоды
  { id: '10_episodes', name: 'Начало пути', description: 'Посмотреть 10 серий', icon: '📼', unlocked: false },
  { id: '50_episodes', name: 'Серийный зритель', description: 'Посмотреть 50 серий', icon: '📺', unlocked: false },
  { id: '100_episodes', name: 'Сотка', description: 'Посмотреть 100 серий', icon: '💯', unlocked: false },
  { id: '500_episodes', name: 'Эпический', description: 'Посмотреть 500 серий', icon: '🎭', unlocked: false },
  { id: '1000_episodes', name: 'Тысячник', description: 'Посмотреть 1000 серий', icon: '🔥', unlocked: false },
  
  // 💬 Комментарии
  { id: 'first_comment', name: 'Комментатор', description: 'Оставить первый комментарий', icon: '💬', unlocked: false },
  { id: '10_comments', name: 'Болтун', description: 'Оставить 10 комментариев', icon: '🗣️', unlocked: false },
  { id: '50_comments', name: 'Оратор', description: 'Оставить 50 комментариев', icon: '📢', unlocked: false },
  { id: '100_comments', name: 'Голос сообщества', description: 'Оставить 100 комментариев', icon: '🎤', unlocked: false },
  { id: 'liked_comment', name: 'Популярный', description: 'Получить 10 лайков на комментарий', icon: '👍', unlocked: false },
  
  // 📝 Рецензии
  { id: 'first_review', name: 'Критик', description: 'Написать первую рецензию', icon: '📝', unlocked: false },
  { id: '5_reviews', name: 'Рецензент', description: 'Написать 5 рецензий', icon: '📋', unlocked: false },
  { id: '10_reviews', name: 'Эксперт кино', description: 'Написать 10 рецензий', icon: '🎬', unlocked: false },
  
  // ❤️ Избранное
  { id: '10_favorites', name: 'Ценитель', description: 'Добавить 10 аниме в избранное', icon: '💖', unlocked: false },
  { id: '25_favorites', name: 'Коллекционер', description: 'Добавить 25 аниме в избранное', icon: '❤️', unlocked: false },
  { id: '50_favorites', name: 'Архивариус', description: 'Добавить 50 аниме в избранное', icon: '🏛️', unlocked: false },
  
  // 📅 Активность
  { id: 'first_day', name: 'Первый день', description: 'Посетить сайт в первый раз', icon: '🎉', unlocked: false },
  { id: 'week_streak', name: 'Неделька', description: 'Посещать сайт 7 дней подряд', icon: '📅', unlocked: false },
  { id: 'month_streak', name: 'Месяц активности', description: 'Посещать сайт 30 дней подряд', icon: '🗓️', unlocked: false },
  { id: 'year_streak', name: 'Год вместе', description: 'Посещать сайт 365 дней', icon: '🎊', unlocked: false },
  { id: 'night_owl', name: 'Сова', description: 'Смотреть аниме после 2 ночи', icon: '🦉', unlocked: false },
  { id: 'early_bird', name: 'Жаворонок', description: 'Смотреть аниме до 6 утра', icon: '🌅', unlocked: false },
  
  // 🎉 Социальное
  { id: 'first_friend', name: 'Новый друг', description: 'Добавить первого друга', icon: '🤝', unlocked: false },
  { id: '5_friends', name: 'Компания', description: 'Иметь 5 друзей', icon: '👥', unlocked: false },
  { id: '10_friends', name: 'Популярный', description: 'Иметь 10 друзей', icon: '⭐', unlocked: false },
  { id: 'watch_party_first', name: 'Первая вечеринка', description: 'Участвовать в Watch Party', icon: '🎬', unlocked: false },
  { id: 'watch_party_host', name: 'Организатор', description: 'Создать 5 Watch Party', icon: '🎪', unlocked: false },
  
  // 🏃 Марафоны
  { id: 'marathon', name: 'Марафонец', description: 'Посмотреть 10 серий за день', icon: '🏃', unlocked: false },
  { id: 'ultra_marathon', name: 'Ультра', description: 'Посмотреть 20 серий за день', icon: '⚡', unlocked: false },
  { id: 'binge_watcher', name: 'Запойный', description: 'Смотреть 5 часов подряд', icon: '🍿', unlocked: false },
  
  // 🎯 Особые
  { id: 'level_10', name: 'Уровень 10', description: 'Достичь 10 уровня', icon: '🔟', unlocked: false },
  { id: 'level_50', name: 'Уровень 50', description: 'Достичь 50 уровня', icon: '🎖️', unlocked: false },
  { id: 'level_100', name: 'Максимальный', description: 'Достичь 100 уровня', icon: '💎', unlocked: false },
  { id: 'first_notification', name: 'Подписчик', description: 'Подписаться на первое аниме', icon: '🔔', unlocked: false },
  { id: 'completionist', name: 'Завершитель', description: 'Получить 25 достижений', icon: '🏅', unlocked: false },
  { id: 'legend', name: 'Легенда KarMi', description: 'Получить все достижения', icon: '👻', unlocked: false },
]

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
            // Загружаем челленджи
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

  // Авто-разблокировка достижений на основе статистики
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

  // Обновление прогресса челленджей
  useEffect(() => {
    if (!stats) return
    
    setChallenges(prev => prev.map(c => {
      if (c.completed) return c
      
      let newProgress = c.progress
      let completed = c.completed
      
      // Ежедневные
      if (c.id === 'daily_login' && stats.daysVisited >= 1) { newProgress = 1; completed = true }
      if (c.id === 'daily_3ep' && stats.episodesWatched >= 3) { newProgress = 3; completed = true }
      if (c.id === 'daily_comment' && stats.commentsPosted >= 1) { newProgress = 1; completed = true }
      if (c.id === 'daily_like') { newProgress = Math.min(stats.episodesWatched, 5); completed = newProgress >= 5 }
      if (c.id === 'daily_favorite' && stats.favoritesCount >= 1) { newProgress = 1; completed = true }
      
      // Еженедельные
      if (c.id === 'weekly_7days' && stats.daysVisited >= 7) { newProgress = 7; completed = true }
      if (c.id === 'weekly_10ep' && stats.episodesWatched >= 10) { newProgress = 10; completed = true }
      if (c.id === 'weekly_5comments' && stats.commentsPosted >= 10) { newProgress = 10; completed = true }
      if (c.id === 'weekly_review' && stats.reviewsWritten >= 1) { newProgress = 1; completed = true }
      
      // Аниме
      if (c.id === 'anime_first' && stats.animeWatched >= 1) { newProgress = 1; completed = true }
      if (c.id === 'anime_5series' && stats.animeWatched >= 5) { newProgress = 5; completed = true }
      if (c.id === 'anime_marathon' && stats.episodesWatched >= 10) { newProgress = 10; completed = true }
      
      // Социальные
      if (c.id === 'social_friend') { newProgress = Math.min(stats.favoritesCount, 1); completed = newProgress >= 1 }
      if (c.id === 'social_5friends') { newProgress = Math.min(stats.favoritesCount, 5); completed = newProgress >= 5 }
      if (c.id === 'social_comment10' && stats.commentsPosted >= 20) { newProgress = 20; completed = true }
      
      // Особые
      if (c.id === 'special_level10' && stats.level >= 10) { newProgress = 1; completed = true }
      if (c.id === 'special_level50' && stats.level >= 50) { newProgress = 1; completed = true }
      if (c.id === 'special_streak30' && stats.daysVisited >= 30) { newProgress = 30; completed = true }
      
      return { ...c, progress: newProgress, completed }
    }))
  }, [stats])

  const uploadAvatar = async (file: File): Promise<string> => {
    setUploadingAvatar(true)
    try {
      const safeName = `${email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${file.name}`
      const res = await fetch(`${supabaseUrl}/storage/v1/object/avatars/${safeName}`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': file.type,
        },
        body: file,
      })
      if (!res.ok) throw new Error('Upload failed')
      return `${supabaseUrl}/storage/v1/object/public/avatars/${safeName}`
    } catch (e) {
      console.error('Avatar upload error:', e)
      alert('Ошибка загрузки аватарки')
      return ''
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Проверка размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой (макс 5MB)')
      return
    }
    
    // Проверка типа
    if (!file.type.startsWith('image/')) {
      alert('Выберите изображение')
      return
    }
    
    // Предпросмотр
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
    setAvatarFile(file)
  }

  // Проверка username на доступность
  const checkUsernameAvailability = async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameAvailable(null)
      return
    }
    
    // Проверка формата (только латиница, цифры, _)
    const validPattern = /^[a-zA-Z0-9_]+$/
    if (!validPattern.test(value)) {
      setUsernameAvailable(false)
      return
    }
    
    setCheckingUsername(true)
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/check_username_available`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_username: value }),
      })
      
      if (res.ok) {
        const isAvailable = await res.json()
        setUsernameAvailable(isAvailable)
      }
    } catch (e) {
      console.error('Check username error:', e)
    } finally {
      setCheckingUsername(false)
    }
  }

  const handleSave = async () => {
    let finalAvatar = avatar
    
    // Если загружен новый файл, загружаем его
    if (avatarFile) {
      const uploadedUrl = await uploadAvatar(avatarFile)
      if (uploadedUrl) {
        finalAvatar = uploadedUrl
      }
    }
    
    // Проверка username если он изменён
    if (username && username.length < 3) {
      alert('Username должен быть не менее 3 символов')
      return
    }
    
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      alert('Username может содержать только латиницу, цифры и _')
      return
    }
    
    const saveData: any = { 
      user_identifier: email, 
      nickname,
      avatar: finalAvatar,
      bio,
    }
    
    if (username) {
      saveData.username = username
    }
    
    // Сохраняем прогресс челленджей
    const completedChallenges = challenges
      .filter(c => c.completed)
      .map(c => ({ id: c.id, progress: c.progress, completed: true }))
    
    if (completedChallenges.length > 0) {
      saveData.challenges = completedChallenges
    }
    
    await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(saveData),
    })
    
    // Очистка
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarFile(null)
    setAvatarPreview('')
    
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
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neo-pink to-neo-red flex items-center justify-center text-4xl font-bold text-white shadow-lg overflow-hidden flex-shrink-0" style={{width: '96px', height: '96px', minWidth: '96px', minHeight: '96px'}}>
            {avatarPreview || avatar ? (
              <img 
                src={avatarPreview || avatar} 
                alt={nickname} 
                className="w-full h-full object-cover" 
                style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} 
              />
            ) : (
              nickname.charAt(0).toUpperCase()
            )}
          </div>
          
          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-3xl font-bold text-white">{nickname}</h1>
              {username && (
                <span className="text-neo-pink text-lg">@{username}</span>
              )}
            </div>
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
        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition ${
            activeTab === 'challenges'
              ? 'bg-neo-pink text-white'
              : 'bg-white/10 text-gray-400 hover:text-white'
          }`}
        >
          🎯 Челленджи ({challenges.filter(c => c.completed).length}/{challenges.length})
        </button>
      </div>

      {/* Контент табов */}
      {activeTab === 'profile' && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Редактировать профиль</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Username</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value)
                    checkUsernameAvailability(e.target.value)
                  }}
                  placeholder="@username"
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                  pattern="[a-zA-Z0-9_]+"
                  minLength={3}
                  maxLength={20}
                />
                {checkingUsername && (
                  <span className="text-gray-400 text-sm flex items-center">⏳</span>
                )}
                {!checkingUsername && username && username.length >= 3 && usernameAvailable === true && (
                  <span className="text-green-400 text-sm flex items-center">✅</span>
                )}
                {!checkingUsername && username && username.length >= 3 && usernameAvailable === false && (
                  <span className="text-red-400 text-sm flex items-center">❌</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Только латиница, цифры и _ (3-20 символов)
              </p>
              {username && username.length < 3 && (
                <p className="text-xs text-red-400 mt-1">Минимум 3 символа</p>
              )}
              {username && !/^[a-zA-Z0-9_]+$/.test(username) && (
                <p className="text-xs text-red-400 mt-1">Только a-z, A-Z, 0-9, _</p>
              )}
            </div>

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
              <label className="text-sm text-gray-400 mb-1 block">Аватар</label>
              <div className="space-y-2">
                {/* Загрузка файлом */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  disabled={uploadingAvatar}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neo-pink/20 file:text-neo-pink hover:file:bg-neo-pink/40 disabled:opacity-50"
                />
                {uploadingAvatar && (
                  <p className="text-xs text-neo-pink">⏳ Загрузка...</p>
                )}
                {avatarFile && !uploadingAvatar && (
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2">
                    <span className="text-green-400 text-sm">✅ Файл выбран: {avatarFile.name}</span>
                  </div>
                )}
                {/* Поле для URL (альтернатива) */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-neo-dark text-gray-400">или через URL</span>
                  </div>
                </div>
                <input
                  type="url"
                  value={avatar}
                  onChange={e => setAvatar(e.target.value)}
                  placeholder="https://..."
                  disabled={!!avatarFile}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white disabled:opacity-50"
                />
              </div>
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

      {activeTab === 'challenges' && (
        <div>
          {/* Прогресс челленджей */}
          <div className="glass rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">
                Выполнено: {challenges.filter(c => c.completed).length}/{challenges.length}
              </h3>
              <span className="text-neo-pink font-semibold">
                {Math.round((challenges.filter(c => c.completed).length / challenges.length) * 100)}%
              </span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-neo-pink to-neo-red transition-all duration-500"
                style={{ width: `${(challenges.filter(c => c.completed).length / challenges.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Категории */}
          <div className="space-y-8">
            {/* Ежедневные */}
            <ChallengeCategory 
              title="📅 Ежедневные" 
              icon="📅"
              challenges={challenges.filter(c => c.category === 'daily')} 
              maxShow={5}
            />
            
            {/* Еженедельные */}
            <ChallengeCategory 
              title="📆 Еженедельные" 
              icon="📆"
              challenges={challenges.filter(c => c.category === 'weekly')} 
              maxShow={5}
            />
            
            {/* Аниме */}
            <ChallengeCategory 
              title="🎬 Аниме челленджи" 
              icon="🎬"
              challenges={challenges.filter(c => c.category === 'anime')} 
              maxShow={5}
            />
            
            {/* Социальные */}
            <ChallengeCategory 
              title="👥 Социальные" 
              icon="👥"
              challenges={challenges.filter(c => c.category === 'social')} 
              maxShow={5}
            />
            
            {/* Особые */}
            <ChallengeCategory 
              title="🎯 Особые" 
              icon="🎯"
              challenges={challenges.filter(c => c.category === 'special')} 
              maxShow={5}
            />
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div>
          {/* Прогресс достижений */}
          <div className="glass rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">
                Прогресс: {achievements.filter(a => a.unlocked).length}/{achievements.length}
              </h3>
              <span className="text-neo-pink font-semibold">
                {Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)}%
              </span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-neo-pink to-neo-red transition-all duration-500"
                style={{ width: `${(achievements.filter(a => a.unlocked).length / achievements.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Фильтры */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('achievements')}
              className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap bg-neo-pink/20 text-neo-pink border border-neo-pink/30"
            >
              Все ({achievements.length})
            </button>
            <button
              onClick={() => {}}
              className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap bg-white/10 text-gray-400 hover:text-white"
            >
              ✅ Разблокировано ({achievements.filter(a => a.unlocked).length})
            </button>
            <button
              onClick={() => {}}
              className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap bg-white/10 text-gray-400 hover:text-white"
            >
              🔒 Закрыто ({achievements.filter(a => !a.unlocked).length})
            </button>
          </div>

          {/* Сетка достижений */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`glass rounded-2xl p-4 transition hover:scale-105 ${
                  achievement.unlocked 
                    ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30' 
                    : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-4xl flex-shrink-0">{achievement.icon}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-sm truncate">{achievement.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{achievement.description}</p>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <p className="text-xs text-yellow-400 mt-2">
                        📅 {new Date(achievement.unlockedAt).toLocaleDateString('ru-RU')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
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

function ChallengeCategory({ 
  title, 
  icon,
  challenges, 
  maxShow = 5 
}: { 
  title: string
  icon: string
  challenges: Challenge[]
  maxShow?: number 
}) {
  const [showAll, setShowAll] = useState(false)
  const displayed = showAll ? challenges : challenges.slice(0, maxShow)
  const completedCount = challenges.filter(c => c.completed).length
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          {icon} {title}
        </h3>
        <span className="text-sm text-gray-400">
          {completedCount}/{challenges.length} ✅
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayed.map((challenge) => (
          <div
            key={challenge.id}
            className={`glass rounded-2xl p-4 transition hover:scale-105 ${
              challenge.completed 
                ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30' 
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="text-3xl flex-shrink-0">{challenge.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white text-sm truncate">{challenge.name}</h4>
                <p className="text-xs text-gray-400 mt-1">{challenge.description}</p>
              </div>
            </div>
            
            {/* Прогресс бар */}
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Прогресс</span>
                <span className={challenge.completed ? 'text-green-400' : 'text-neo-pink'}>
                  {challenge.progress}/{challenge.target}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    challenge.completed 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                      : 'bg-gradient-to-r from-neo-pink to-neo-red'
                  }`}
                  style={{ width: `${Math.min((challenge.progress / challenge.target) * 100, 100)}%` }}
                />
              </div>
            </div>
            
            {/* Награда */}
            <div className={`text-xs font-semibold ${
              challenge.completed ? 'text-green-400' : 'text-yellow-400'
            }`}>
              🎁 {challenge.reward}
            </div>
          </div>
        ))}
      </div>
      
      {challenges.length > maxShow && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 text-neo-pink hover:text-neo-pink/80 text-sm font-medium flex items-center gap-1"
        >
          {showAll ? 'Свернуть' : 'Показать все'} {showAll ? '↑' : '↓'}
        </button>
      )}
    </div>
  )
}