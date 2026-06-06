/**
 * Типы для пользовательской системы
 */

export interface UserStats {
  animeWatched: number
  episodesWatched: number
  hoursWatched: number
  commentsPosted: number
  favoritesCount: number
  level: number
  xp?: number
  lastActive?: Date
}

export interface UserProfile {
  id: string
  user_identifier: string
  nickname?: string
  avatar?: string
  bio?: string
  stats?: UserStats
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: (stats: UserStats) => boolean
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
}

export interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  friend_nickname?: string
  friend_avatar?: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message?: string
  data?: Record<string, any>
  is_read: boolean
  created_at: string
}
