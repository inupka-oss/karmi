'use client'
import { useState, useEffect } from 'react'

interface Comment {
  id: string
  user_name: string
  user_avatar: string
  content: string
  created_at: string
}

export default function CommentSection({ animeId }: { animeId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const loadComments = async () => {
    const res = await fetch(`${supabaseUrl}/rest/v1/comments?anime_id=eq.${animeId}&order=created_at.desc`, {
      headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
    })
    if (res.ok) setComments(await res.json())
  }

  useEffect(() => {
    loadComments()
  }, [animeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    await fetch(`${supabaseUrl}/rest/v1/comments`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        anime_id: animeId,
        user_name: name || 'Аноним',
        user_avatar: '',
        content: text,
      }),
    })
    setText('')
    loadComments()
  }

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-white mb-4">Комментарии</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-6">
        <input
          type="text"
          placeholder="Ваше имя (необязательно)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
        />
        <textarea
          placeholder="Оставьте комментарий..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
          required
        />
        <button type="submit" className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-xl self-end">
          Отправить
        </button>
      </form>
      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="glass p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-neo-pink/30 flex items-center justify-center text-white text-sm font-bold">
                {c.user_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-white font-medium">{c.user_name}</span>
              <span className="text-gray-400 text-sm">{new Date(c.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
            <p className="text-gray-300">{c.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}