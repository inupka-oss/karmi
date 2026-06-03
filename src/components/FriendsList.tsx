'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

interface Friend {
  id: string
  nickname: string
  avatar?: string
  isOnline?: boolean
  status: 'pending' | 'accepted' | 'blocked'
}

interface FriendsListProps {
  userId?: string
}

export default function FriendsList({ userId }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([])
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [friendEmail, setFriendEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const loadFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Загружаем все заявки и друзей
      const { data } = await supabase
        .from('user_friends_with_profiles')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

      if (data) {
        const accepted: Friend[] = []
        const pending: Friend[] = []

        data.forEach((f: any) => {
          const isMe = f.user_id === user.id
          const friendData: Friend = {
            id: isMe ? f.friend_id : f.user_id,
            nickname: isMe ? (f.friend_nickname || 'Друг') : (f.user_nickname || 'Пользователь'),
            avatar: isMe ? f.friend_avatar : f.user_avatar,
            isOnline: false,
            status: f.status as 'pending' | 'accepted' | 'blocked',
          }

          if (f.status === 'accepted') {
            accepted.push(friendData)
          } else if (f.status === 'pending' && !isMe) {
            pending.push({ ...friendData, id: f.id }) // ID заявки для принятия
          }
        })

        setFriends(accepted)
        setPendingRequests(pending)
      }
    } catch (e) {
      console.error('Load friends error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFriends()
  }, [])

  const sendFriendRequest = async () => {
    if (!friendEmail.trim()) return
    setActionLoading('send')

    try {
      const { error } = await supabase.rpc('send_friend_request', {
        p_friend_email: friendEmail,
      })

      if (error) throw error
      alert('Заявка отправлена!')
      setFriendEmail('')
      setShowAddFriend(false)
      loadFriends()
    } catch (e: any) {
      alert(e.message || 'Ошибка при отправке заявки')
    } finally {
      setActionLoading(null)
    }
  }

  const acceptFriendRequest = async (requestId: string) => {
    setActionLoading(requestId)

    try {
      const { error } = await supabase.rpc('accept_friend_request', {
        p_request_id: requestId,
      })

      if (error) throw error
      alert('Друг добавлен!')
      loadFriends()
    } catch (e) {
      alert('Ошибка при принятии заявки')
    } finally {
      setActionLoading(null)
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!confirm('Удалить из друзей?')) return
    setActionLoading(friendId)

    try {
      const { error } = await supabase
        .from('user_friends')
        .delete()
        .or(`id.eq.${friendId},and(user_id.eq.${friendId},friend_id.eq.${friends[0]?.id})`)

      if (error) throw error
      alert('Друг удалён')
      loadFriends()
    } catch (e) {
      alert('Ошибка при удалении')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="glass p-6 rounded-xl">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10" />
              <div className="flex-1 h-4 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass p-6 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">👥 Друзья</h2>
        <button
          onClick={() => setShowAddFriend(!showAddFriend)}
          className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-lg text-sm transition"
        >
          ➕ Добавить
        </button>
      </div>

      {/* Форма добавления друга */}
      {showAddFriend && (
        <div className="mb-6 p-4 bg-white/5 rounded-xl">
          <h3 className="text-white font-semibold mb-3">Добавить друга</h3>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Email друга"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
            />
            <button
              onClick={sendFriendRequest}
              disabled={actionLoading === 'send'}
              className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
            >
              {actionLoading === 'send' ? '⏳...' : 'Отправить'}
            </button>
          </div>
          <button
            onClick={() => setShowAddFriend(false)}
            className="mt-2 text-gray-400 hover:text-white text-sm"
          >
            Отмена
          </button>
        </div>
      )}

      {/* Заявки в друзья */}
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-3">📨 Входящие заявки ({pendingRequests.length})</h3>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {request.avatar ? (
                    <img src={request.avatar} alt={request.nickname} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neo-pink/20 flex items-center justify-center text-neo-pink">
                      {request.nickname[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-white">{request.nickname}</span>
                </div>
                <button
                  onClick={() => acceptFriendRequest(request.id)}
                  disabled={actionLoading === request.id}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {actionLoading === request.id ? '⏳...' : '✓ Принять'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Список друзей */}
      <div>
        <h3 className="text-white font-semibold mb-3">
          ✅ Друзья ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            У вас пока нет друзей. Добавьте друзей по email!
          </p>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {friend.avatar ? (
                    <img src={friend.avatar} alt={friend.nickname} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neo-pink/20 flex items-center justify-center text-neo-pink">
                      {friend.nickname[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="text-white block">{friend.nickname}</span>
                    {friend.isOnline && (
                      <span className="text-green-400 text-xs">● Онлайн</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeFriend(friend.id)}
                  disabled={actionLoading === friend.id}
                  className="text-gray-400 hover:text-red-400 transition disabled:opacity-50"
                  title="Удалить из друзей"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
