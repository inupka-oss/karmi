'use client'
import { useState, useEffect } from 'react'

interface Comment {
  id: string
  anime_id: string
  user_id?: string
  user_name: string
  content: string
  created_at: string
  parent_id?: string
  likes: number
  dislikes: number
  replies?: Comment[]
}

interface User {
  id: string
  name: string
  email: string
}

function CommentItem({ 
  comment, 
  onReply, 
  onLike, 
  onDislike,
  depth = 0 
}: { 
  comment: Comment
  onReply: (parentId: string, content: string) => Promise<void>
  onLike: (commentId: string) => Promise<void>
  onDislike: (commentId: string) => Promise<void>
  depth?: number
}) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setSubmitting(true)
    await onReply(comment.id, replyText)
    setReplyText('')
    setShowReplyForm(false)
    setSubmitting(false)
  }

  return (
    <div className={`${depth > 0 ? 'ml-4 sm:ml-8 border-l-2 border-white/10 pl-4' : ''}`}>
      <div className="glass p-4 rounded-xl mb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neo-pink to-neo-red flex items-center justify-center text-white text-sm font-bold">
              {comment.user_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-white font-medium block">
                {comment.user_name}
              </span>
              <span className="text-gray-500 text-xs">
                {new Date(comment.created_at).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1">
              <button
                onClick={() => onLike(comment.id)}
                className="text-sm text-gray-400 hover:text-green-400 transition"
              >
                👍 {comment.likes || 0}
              </button>
              <button
                onClick={() => onDislike(comment.id)}
                className="text-sm text-gray-400 hover:text-red-400 transition"
              >
                👎 {comment.dislikes || 0}
              </button>
            </div>
            {depth < 3 && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-neo-pink hover:text-neo-pink/80 transition"
              >
                Ответить
              </button>
            )}
          </div>
        </div>

        <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>

        {showReplyForm && (
          <form onSubmit={handleSubmitReply} className="mt-3">
            <textarea
              placeholder="Ваш ответ..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none"
              required
            />
            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowReplyForm(false)}
                className="text-gray-400 hover:text-white text-sm px-3 py-1"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-neo-pink hover:bg-neo-pink/80 disabled:bg-gray-500 text-white px-4 py-1 rounded-lg text-sm"
              >
                {submitting ? '...' : 'Ответить'}
              </button>
            </div>
          </form>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
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
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Загрузка пользователя
  useEffect(() => {
    const loadUser = async () => {
      const token = document.cookie.match(/sb-access-token=([^;]+)/)?.[1]
      if (!token) return

      try {
        const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: { 
            'apikey': supabaseAnonKey, 
            'Authorization': `Bearer ${token}` 
          },
        })
        if (res.ok) {
          const userData = await res.json()
          setUser({
            id: userData.id,
            name: userData.email?.split('@')[0] || 'Аноним',
            email: userData.email,
          })
        }
      } catch (e) {
        console.error('Load user error:', e)
      }
    }
    loadUser()
  }, [supabaseUrl, supabaseAnonKey])

  // Загрузка комментариев
  const loadComments = async () => {
    try {
      const token = document.cookie.match(/sb-access-token=([^;]+)/)?.[1]
      const headers: HeadersInit = { 
        'apikey': supabaseAnonKey, 
        'Content-Type': 'application/json' 
      }
      if (token) {
        ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch(
        `${supabaseUrl}/rest/v1/comments?anime_id=eq.${animeId}&order=created_at.desc`,
        { headers }
      )
      
      if (!res.ok) {
        console.error('Load comments error:', await res.text())
        return
      }

      const allComments: Comment[] = await res.json()

      // Группировка комментариев (родители + ответы)
      const commentMap = new Map<string, Comment>()
      const rootComments: Comment[] = []

      allComments.forEach(c => {
        commentMap.set(c.id, { ...c, replies: [] })
      })

      allComments.forEach(c => {
        const comment = commentMap.get(c.id)!
        if (c.parent_id) {
          const parent = commentMap.get(c.parent_id)
          if (parent) parent.replies?.push(comment)
        } else {
          rootComments.push(comment)
        }
      })

      // Сортировка ответов по дате
      commentMap.forEach(c => {
        if (c.replies) {
          c.replies.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        }
      })

      setComments(rootComments)
    } catch (e) {
      console.error('Load comments error:', e)
    }
  }

  useEffect(() => {
    loadComments()
  }, [animeId])

  // Отправка комментария
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    const token = document.cookie.match(/sb-access-token=([^;]+)/)?.[1]
    
    if (!token) {
      alert('Войдите чтобы оставлять комментарии')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/comments`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          anime_id: animeId,
          user_name: user?.name || 'Аноним',
          content: text,
          parent_id: null,
          likes: 0,
          dislikes: 0,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        console.error('Submit error:', error)
        alert('Ошибка: ' + (error.message || 'Не удалось отправить'))
        return
      }

      setText('')
      await loadComments()
      alert('Комментарий добавлен! ✅')
    } catch (error) {
      console.error('Submit error:', error)
      alert('Ошибка при отправке')
    } finally {
      setLoading(false)
    }
  }

  // Ответ на комментарий
  const handleReply = async (parentId: string, content: string) => {
    const token = document.cookie.match(/sb-access-token=([^;]+)/)?.[1]
    if (!token) {
      alert('Войдите чтобы отвечать')
      return
    }

    try {
      await fetch(`${supabaseUrl}/rest/v1/comments`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          anime_id: animeId,
          user_name: user?.name || 'Аноним',
          content: content,
          parent_id: parentId,
          likes: 0,
          dislikes: 0,
        }),
      })
      await loadComments()
    } catch (e) {
      console.error('Reply error:', e)
    }
  }

  // Реакции (лайк/дизлайк)
  const handleReaction = async (commentId: string, type: 'like' | 'dislike') => {
    const token = document.cookie.match(/sb-access-token=([^;]+)/)?.[1]
    if (!token) {
      alert('Войдите чтобы оценивать')
      return
    }

    const comment = comments.find(c => c.id === commentId) || 
                   comments.flatMap(c => c.replies || []).find(c => c.id === commentId)
    if (!comment) return

    // Оптимистичное обновление UI
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          likes: type === 'like' ? (c.likes || 0) + 1 : c.likes,
          dislikes: type === 'dislike' ? (c.dislikes || 0) + 1 : c.dislikes,
        }
      }
      if (c.replies) {
        return { ...c, replies: c.replies.map(r => 
          r.id === commentId 
            ? { ...r, likes: type === 'like' ? (r.likes || 0) + 1 : r.likes, dislikes: type === 'dislike' ? (r.dislikes || 0) + 1 : r.dislikes }
            : r
        )}
      }
      return c
    }))

    // Обновление в базе
    try {
      const newLikes = type === 'like' ? (comment.likes || 0) + 1 : comment.likes
      const newDislikes = type === 'dislike' ? (comment.dislikes || 0) + 1 : comment.dislikes
      
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
      <h2 className="text-2xl font-bold text-white mb-4">
        💬 Комментарии ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
      </h2>

      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          placeholder="Оставьте комментарий..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white resize-none"
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className="mt-3 bg-neo-pink hover:bg-neo-pink/80 disabled:bg-gray-500 text-white px-6 py-2 rounded-xl transition"
        >
          {loading ? 'Отправка...' : 'Отправить'}
        </button>
      </form>

      {comments.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          Будьте первым, кто оставит комментарий!
        </p>
      ) : (
        <div>
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              onReply={handleReply}
              onLike={handleReaction}
              onDislike={handleReaction}
            />
          ))}
        </div>
      )}
    </div>
  )
}
