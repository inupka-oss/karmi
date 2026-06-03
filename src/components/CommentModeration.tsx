'use client'
import { useState, useEffect } from 'react'

interface Comment {
  id: string
  anime_id: string
  user_id?: string
  user_name: string
  content: string
  created_at: string
  is_deleted?: boolean
  reports_count?: number
  anime_title?: string
}

export default function CommentModeration() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'reported' | 'deleted'>('all')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const loadComments = async () => {
    setLoading(true)
    try {
      let query = `${supabaseUrl}/rest/v1/comments?select=*&order=created_at.desc`
      if (filter === 'reported') {
        query += `&reports_count=gt.0`
      } else if (filter === 'deleted') {
        query += `&is_deleted=eq.true`
      }

      const res = await fetch(query, {
        headers: { 'apikey': supabaseAnonKey },
      })
      if (res.ok) {
        let data = await res.json()
        
        // Получаем названия аниме
        const animeIds = [...new Set(data.map((c: Comment) => c.anime_id))]
        const animeRes = await fetch(`${supabaseUrl}/rest/v1/anime?id=in.(${animeIds.join(',')})&select=id,title_ru`, {
          headers: { 'apikey': supabaseAnonKey },
        })
        if (animeRes.ok) {
          const animeData = await animeRes.json()
          const animeMap = new Map(animeData.map((a: any) => [a.id, a.title_ru]))
          data = data.map((c: Comment) => ({
            ...c,
            anime_title: animeMap.get(c.anime_id) || 'Неизвестно',
          }))
        }
        
        setComments(data)
      }
    } catch (e) {
      console.error('Load comments error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [filter])

  const handleDelete = async (commentId: string) => {
    if (!confirm('Удалить этот комментарий?')) return
    
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/comments?id=eq.${commentId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_deleted: true, content: '[удалено модератором]' }),
      })
      if (res.ok) {
        setComments(prev => prev.map(c => 
          c.id === commentId ? { ...c, is_deleted: true, content: '[удалено модератором]' } : c
        ))
      }
    } catch (e) {
      console.error('Delete comment error:', e)
    }
  }

  const handleRestore = async (commentId: string) => {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/comments?id=eq.${commentId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_deleted: false, content: '[восстановлено]' }),
      })
      if (res.ok) {
        loadComments()
      }
    } catch (e) {
      console.error('Restore comment error:', e)
    }
  }

  const handleBanUser = async (userId?: string) => {
    if (!userId) {
      alert('ID пользователя не найден')
      return
    }
    if (!confirm('Заблокировать этого пользователя?')) return
    
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_identifier=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_banned: true }),
      })
      if (res.ok) {
        alert('Пользователь заблокирован')
      }
    } catch (e) {
      console.error('Ban user error:', e)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">🛡️ Модерация комментариев</h2>
        
        {/* Фильтры */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-neo-pink text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setFilter('reported')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === 'reported'
                ? 'bg-red-500 text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            🚩 Жалобы
          </button>
          <button
            onClick={() => setFilter('deleted')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === 'deleted'
                ? 'bg-gray-500 text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            🗑️ Удалённые
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass p-4 rounded-xl animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          Нет комментариев для отображения
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`glass p-4 rounded-xl ${
                comment.is_deleted ? 'opacity-50' : ''
              } ${comment.reports_count ? (comment.reports_count > 2 ? 'border-red-500/50' : '') : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-white font-medium">{comment.user_name}</span>
                    {comment.user_id && (
                      <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                        ID: {comment.user_id.slice(0, 8)}...
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(comment.created_at).toLocaleString('ru-RU')}
                    </span>
                    {comment.reports_count ? (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                        🚩 {comment.reports_count} жалоб
                      </span>
                    ) : null}
                    {comment.is_deleted && (
                      <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full">
                        Удалён
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 mb-2">{comment.content}</p>
                  <div className="text-xs text-gray-400">
                    Аниме: <span className="text-neo-pink">{comment.anime_title}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  {!comment.is_deleted ? (
                    <>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1 rounded-lg text-sm transition"
                      >
                        Удалить
                      </button>
                      {comment.user_id && (
                        <button
                          onClick={() => handleBanUser(comment.user_id)}
                          className="bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 px-3 py-1 rounded-lg text-sm transition"
                        >
                          Бан
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleRestore(comment.id)}
                      className="bg-green-500/20 hover:bg-green-500/40 text-green-400 px-3 py-1 rounded-lg text-sm transition"
                    >
                      Восстановить
                    </button>
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
