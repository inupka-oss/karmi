/**
 * Типы для системы комментариев
 */

export type ReactionType = 'like' | 'dislike'

export interface Comment {
  id: string
  anime_id: string
  user_id?: string
  user_name: string
  user_email?: string
  user_avatar?: string
  content: string
  parent_id?: string
  likes: number
  dislikes: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  replies?: Comment[]
}

export interface CommentWithReplies extends Comment {
  replies: Comment[]
}
