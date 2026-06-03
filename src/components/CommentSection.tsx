'use client'
import { useState, useEffect, useCallback } from 'react'

interface Comment {
  id: string
  user_id?: string
  user_name: string
  user_avatar?: string
  content: string
  created_at: string
  parent_id?: string
  replies?: Comment[]
  likes?: number
  dislikes?: number
  user_reaction?: 'like' | 'dislike' | null
  is_deleted?: boolean
}

function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/sb-access-token=([^;]+)/)
  return match ? match[1] : null
}

function CommentItem({ 
  comment, 
  onReply, 
  onLike, 
  onDislike,
  depth = 0 
}: { 
  comment: Comment
  onReply: (comment: Comment, content: string) => Promise<void>
  onLike: (commentId: string) => Promise<void>
  onDislike: (commentId: string) => Promise<void>
  depth?: number
}) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setIsSubmitting(true)
    await onReply(comment, replyText)
    setReplyText('')
    setShowReplyForm(false)
    setIsSubmitting(false)
  }

  const maxDepth = 5

  return (
    <div className={`${depth > 0 ? 'ml-4 sm:ml-8 border-l-2 border-white/10 pl-4' : ''}`}>
      <div className={`glass p-4 rounded-xl ${collapsed ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neo-pink to-neo-red flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {comment.user_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-white font-medium truncate block">
                {comment.user_name}
              </span>
              <span className="text-gray-500 text-xs">
                {new Date(comment.created_at).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
              <button
                onClick={() => onLike(comment.id)}
                className={`text-sm flex items-center gap-1 transition ${
                  comment.user_reaction === 'like' 
                    ? 'text-green-400' 
                    : 'text-gray-400 hover:text-green-400'
                }`}
              >
                👍 <span>{comment.likes || 0}</span>
              </button>
              <button
                onClick={() => onDislike(comment.id)}
                className={`text-sm flex items-center gap-1 transition ${
                  comment.user_reaction === 'dislike' 
                    ? 'text-red-400' 
                    : 'text-gray-400 hover:text-red-400'
                }`}
              >
                👎 <span>{comment.dislikes || 0}</span>
              </button>
            </div>

            {depth < maxDepth && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-neo-pink hover:text-neo-pink/80 transition"
              >
                Ответить
              </button>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="text-xs text-gray-400 hover:text-white transition"
              >
                {collapsed ? `+${comment.replies.length}` : '−'}
              </button>
            )}
          </div>
        </div>

        {comment.is_deleted ? (
          <p className="text-gray-500 italic">Комментарий удалён</p>
        ) : (
          <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
        )}

        {showReplyForm && (
          <form onSubmit={handleSubmitReply} className="mt-3 flex flex-col gap-2">
            <textarea
              placeholder="Ваш ответ..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none"
              required
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowReplyForm(false)}
                className="text-gray-400 hover:text-white text-sm px-3 py-1"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-neo-pink hover:bg-neo-pink/80 disabled:bg-gray-500 text-white px-4 py-1 rounded-lg text-sm transition"
              >
                {isSubmitting ? '...' : 'Ответить'}
              </button>
            </div>
          </form>
        )}
      </div>

      {!collapsed && comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              onDislike={onDislike}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CommentSection({ animeId }: { animeId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const loadCurrentUser = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return null
    
    try {
      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
      })
      if (userRes.ok) {
        const user = await userRes.json()
        const profileRes = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_identifier=eq.${user.id}`, {
          headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
        })
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          return {
            id: user.id,
            name: profileData[0]?.nickname || user.email?.split('@')[0] || 'Аноним',
          }
        }
      }
    } catch {}
    return null
  }, [supabaseUrl, supabaseAnonKey])

  const loadComments = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = getAccessToken()
      const headers: HeadersInit = { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' }
      if (token) {
        ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch(
        `${supabaseUrl}/rest/v1/comments?anime_id=eq.${animeId}&select=*&order=created_at.desc`,
        { headers }
      )
      if (!res.ok) return
      
      let allComments: Comment[] = await res.json()

      if (token) {
        const user = await loadCurrentUser()
        setCurrentUser(user)
        if (user) {
          const reactionsRes = await fetch(
            `${supabaseUrl}/rest/v1/comment_reactions?user_id=eq.${user.id}&comment_id=in.(${allComments.map(c => c.id).join(',')})`,
            { headers }
          )
          if (reactionsRes.ok) {
            const reactions = await reactionsRes.json()
            allComments = allComments.map(c => {
              const reaction = reactions.find((r: any) => r.comment_id === c.id)
              return {
                ...c,
                user_reaction: reaction?.type || null,
              }
            })
          }
        }
      }

      const commentMap = new Map<string, Comment>()
      const rootComments: Comment[] = []

      allComments.forEach(c => {
        commentMap.set(c.id, { ...c, replies: [] })
      })

      allComments.forEach(c => {
        if (c.parent_id) {
          const parent = commentMap.get(c.parent_id)
          if (parent) {
            parent.replies?.push(commentMap.get(c.id)!)
          }
        } else {
          rootComments.push(commentMap.get(c.id)!)
        }
      })

      commentMap.forEach(c => {
        if (c.replies) {
          c.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        }
      })

      setComments(rootComments)
    } catch (e) {
      console.error('Load comments error:', e)
    } finally {
      setIsLoading(false)
    }
  }, [animeId, supabaseUrl, supabaseAnonKey, loadCurrentUser])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    const token = getAccessToken()
    
    if (!token) {
      alert('Пожалуйста, войдите в систему чтобы оставлять комментарии')
      return
    }

    const submitName = currentUser?.name || name || 'Аноним'
    setLoading(true)

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/save_anime_comment`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          p_anime_id: animeId,
          p_user_name: submitName,
          p_content: text,
          p_parent_id: null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Comment submit error:', error)
        alert('Ошибка: ' + (error.message || error.details || 'Не удалось отправить комментарий'))
        return
      }

      setText('')
      loadComments()
      alert('Комментарий добавлен! ✅')
    } catch (error) {
      console.error('Comment submit error:', error)
      alert('Ошибка при отправке комментария')
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (parentComment: Comment, content: string) => {
    const token = getAccessToken()
    if (!token) {
      alert('Пожалуйста, войдите чтобы отвечать на комментарии')
      return
    }

    await fetch(`${supabaseUrl}/rest/v1/rpc/save_anime_comment`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        p_anime_id: animeId,
        p_user_name: currentUser?.name || 'Аноним',
        p_content: content,
        p_parent_id: parentComment.id,
      }),
    })
    loadComments()
  }

  const handleReaction = async (commentId: string, type: 'like' | 'dislike') => {
    const token = getAccessToken()
    if (!token) {
      alert('Пожалуйста, войдите чтобы оценивать комментарии')
      return
    }

    const comment = comments.find(c => c.id === commentId) || 
                   comments.flatMap(c => c.replies || []).find(c => c.id === commentId)
    if (!comment) return

    const currentReaction = comment.user_reaction
    const isRemoving = currentReaction === type

    const updateCommentReactions = (comments: Comment[]): Comment[] => {
      return comments.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            likes: type === 'like' ? (c.likes || 0) + (isRemoving ? -1 : 1) : c.likes,
            dislikes: type === 'dislike' ? (c.dislikes || 0) + (isRemoving ? -1 : 1) : c.dislikes,
            user_reaction: isRemoving ? null : type,
          }
        }
        if (c.replies) {
          return { ...c, replies: updateCommentReactions(c.replies) }
        }
        return c
      })
    }
    setComments(updateCommentReactions(comments))

    try {
      await fetch(`${supabaseUrl}/rest/v1/comment_reactions`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          comment_id: commentId,
          type: isRemoving ? null : type,
        }),
      })

      const newLikes = (comment.likes || 0) + (type === 'like' && !isRemoving ? 1 : isRemoving ? -1 : 0)
      const newDislikes = (comment.dislikes || 0) + (type === 'dislike' && !isRemoving ? 1 : isRemoving ? -1 : 0)
      
      await fetch(`${supabaseUrl}/rest/v1/comments?id=eq.${commentId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ likes: newLikes, dislikes: newDislikes }),
      })
    } catch (e) {
      console.error('Reaction error:', e)
      loadComments()
    }
  }

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        💬 Комментарии
        <span className="text-sm font-normal text-gray-400">
          ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
        </span>
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">
        {!currentUser && (
          <input
            type="text"
            placeholder="Ваше имя (необязательно)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
          />
        )}
        <textarea
          placeholder="Оставьте комментарий..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white resize-none"
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-neo-pink hover:bg-neo-pink/80 disabled:bg-gray-500 text-white px-6 py-2 rounded-xl self-end transition"
        >
          {loading ? 'Отправка...' : 'Отправить'}
        </button>
      </form>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass p-4 rounded-xl animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-white/10" />
                <div className="h-4 bg-white/10 rounded w-32" />
              </div>
              <div className="h-16 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          Будьте первым, кто оставит комментарий!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              onReply={handleReply}
              onLike={(id) => handleReaction(id, 'like')}
              onDislike={(id) => handleReaction(id, 'dislike')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
