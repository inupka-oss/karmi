/**
 * Система достижений для Karmi
 * Автоматическая проверка и выдача достижений
 */

import { useState, useEffect } from 'react'
import type { Achievement, UserStats } from '@/types/user'
import { getAccessToken } from '@/lib/auth'

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_anime',
    name: 'Первый шаг',
    description: 'Посмотреть первое аниме',
    icon: '🎬',
    condition: (stats) => stats.animeWatched >= 1,
  },
  {
    id: '10_anime',
    name: 'Опытный',
    description: 'Посмотреть 10 аниме',
    icon: '🌟',
    condition: (stats) => stats.animeWatched >= 10,
  },
  {
    id: '50_anime',
    name: 'Эксперт',
    description: 'Посмотреть 50 аниме',
    icon: '⭐',
    condition: (stats) => stats.animeWatched >= 50,
  },
  {
    id: '100_anime',
    name: 'Легенда',
    description: 'Посмотреть 100 аниме',
    icon: '🏆',
    condition: (stats) => stats.animeWatched >= 100,
  },
  {
    id: 'first_comment',
    name: 'Комментатор',
    description: 'Оставить первый комментарий',
    icon: '💬',
    condition: (stats) => stats.commentsPosted >= 1,
  },
  {
    id: '10_comments',
    name: 'Болтун',
    description: 'Оставить 10 комментариев',
    icon: '🗣️',
    condition: (stats) => stats.commentsPosted >= 10,
  },
  {
    id: 'collector',
    name: 'Коллекционер',
    description: 'Добавить 20 аниме в избранное',
    icon: '❤️',
    condition: (stats) => stats.favoritesCount >= 20,
  },
  {
    id: 'week_streak',
    name: 'Неделька',
    description: 'Посещать сайт 7 дней подряд',
    icon: '📅',
    condition: (stats) => {
      // Проверка стрика будет реализована отдельно
      return false
    },
  },
  {
    id: 'month_streak',
    name: 'Месяц активности',
    description: 'Посещать сайт 30 дней подряд',
    icon: '🗓️',
    condition: (stats) => false,
  },
  {
    id: 'night_owl',
    name: 'Сова',
    description: 'Смотреть аниме после 2 ночи',
    icon: '🦉',
    condition: (stats) => {
      const hour = new Date().getHours()
      return hour >= 2 && hour <= 5
    },
  },
  {
    id: 'marathon',
    name: 'Марафонец',
    description: 'Посмотреть 10 серий за день',
    icon: '🏃',
    condition: (stats) => stats.episodesWatched >= 10, // Нужна отдельная логика по дням
  },
]

/**
 * Проверка и получение новых достижений
 */
export async function checkAchievements(
  supabaseUrl: string,
  supabaseAnonKey: string,
  userId: string,
  stats: UserStats
): Promise<string[]> {
  const unlockedAchievements: string[] = []
  const token = getAccessToken()

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/user_achievements?user_id=eq.${userId}&select=achievement_id`,
      {
        headers: {
          'apikey': supabaseAnonKey,
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const existing = await response.json()
    const existingIds = new Set(existing.map((a: any) => a.achievement_id))

    for (const achievement of ACHIEVEMENTS) {
      if (!existingIds.has(achievement.id) && achievement.condition(stats)) {
        await fetch(`${supabaseUrl}/rest/v1/user_achievements`, {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            user_id: userId,
            achievement_id: achievement.id,
          }),
        })

        unlockedAchievements.push(achievement.id)
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error)
  }

  return unlockedAchievements
}

/**
 * Обновление статистики пользователя
 */
export async function updateUserStats(
  supabaseUrl: string,
  supabaseAnonKey: string,
  userId: string,
  updates: Partial<UserStats>
) {
  try {
    // Получаем текущую статистику
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?user_identifier=eq.${userId}&select=stats`,
      {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${getAccessToken()}`,
        },
      }
    )

    const profileData = await profileRes.json()
    const currentStats = profileData[0]?.stats || {}

    // Обновляем статистику
    const newStats = { ...currentStats, ...updates }

    await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_identifier: userId,
        stats: newStats,
      }),
    })

    // Проверяем достижения
    const unlocked = await checkAchievements(supabaseUrl, supabaseAnonKey, userId, newStats as UserStats)
    
    return { success: true, unlocked }
  } catch (error) {
    console.error('Error updating stats:', error)
    return { success: false, error }
  }
}

/**
 * Выдача коллекционной карточки
 */
export async function awardCollectionCard(
  supabaseUrl: string,
  supabaseAnonKey: string,
  userId: string,
  animeId: string
) {
  try {
    // Определяем редкость (случайно)
    const rand = Math.random()
    let rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common'
    
    if (rand > 0.99) rarity = 'legendary'      // 1%
    else if (rand > 0.95) rarity = 'epic'      // 4%
    else if (rand > 0.80) rarity = 'rare'      // 15%
    else rarity = 'common'                      // 80%

    await fetch(`${supabaseUrl}/rest/v1/collection_cards`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        anime_id: animeId,
        rarity,
      }),
    })

    return { success: true, rarity }
  } catch (error) {
    console.error('Error awarding card:', error)
    return { success: false, error }
  }
}

/**
 * Обновление прогресса челленджа
 */
export async function updateChallengeProgress(
  supabaseUrl: string,
  supabaseAnonKey: string,
  userId: string,
  challengeId: string,
  increment: number = 1
) {
  try {
    // Получаем текущий прогресс
    const res = await fetch(
      `${supabaseUrl}/rest/v1/user_challenges?user_id=eq.${userId}&challenge_id=eq.${challengeId}&select=*`,
      {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${getAccessToken()}`,
        },
      }
    )

    const challenges = await res.json()
    
    if (challenges.length === 0) {
      // Создаём новый челлендж
      const challengeData = getChallengeData(challengeId)
      if (!challengeData) return { success: false }

      await fetch(`${supabaseUrl}/rest/v1/user_challenges`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          challenge_id: challengeId,
          progress: increment,
          target: challengeData.target,
          reward: challengeData.reward,
          type: challengeData.type,
          reset_at: new Date().toISOString(),
        }),
      })
    } else {
      const challenge = challenges[0]
      
      if (!challenge.completed) {
        const newProgress = challenge.progress + increment
        const isCompleted = newProgress >= challenge.target

        await fetch(`${supabaseUrl}/rest/v1/user_challenges?id=eq.${challenge.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${getAccessToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            progress: newProgress,
            completed: isCompleted,
            updated_at: new Date().toISOString(),
          }),
        })

        if (isCompleted) {
          // Получаем текущий XP и обновляем
          const currentProfile = await fetch(
            `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}&select=stats`,
            {
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${getAccessToken()}`,
              },
            }
          )
          const profileData = await currentProfile.json()
          const currentXp = profileData[0]?.stats?.xp || 0
          
          // Начисляем награду (XP)
          await updateUserStats(supabaseUrl, supabaseAnonKey, userId, {
            xp: currentXp + challenge.reward,
          })
        }

        return { success: true, completed: isCompleted }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating challenge:', error)
    return { success: false, error }
  }
}

function getChallengeData(challengeId: string) {
  const challenges: Record<string, { target: number; reward: number; type: string }> = {
    'daily_watch': { target: 3, reward: 50, type: 'daily' },
    'daily_comment': { target: 2, reward: 30, type: 'daily' },
    'weekly_anime': { target: 2, reward: 200, type: 'weekly' },
    'weekly_rating': { target: 5, reward: 100, type: 'weekly' },
    'seasonal_ongoing': { target: 5, reward: 500, type: 'seasonal' },
  }
  return challenges[challengeId]
}



/**
 * Хук для отслеживания достижений
 */
export function useAchievements(userId: string) {
  const [achievements, setAchievements] = useState<any[]>([])
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!userId) return

    const loadAchievements = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      const res = await fetch(
        `${supabaseUrl}/rest/v1/user_achievements?user_id=eq.${userId}&select=achievement_id,unlocked_at`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${getAccessToken()}`,
          },
        }
      )

      const data = await res.json()
      setUnlockedIds(new Set(data.map((a: any) => a.achievement_id)))
      
      const achievementsWithStatus = ACHIEVEMENTS.map(a => ({
        ...a,
        unlocked: unlockedIds.has(a.id),
        unlockedAt: data.find((d: any) => d.achievement_id === a.id)?.unlocked_at,
      }))
      
      setAchievements(achievementsWithStatus)
    }

    loadAchievements()
  }, [userId])

  return { achievements, unlockedIds }
}


