'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

interface Participant {
  id: string
  nickname: string
  avatar?: string
  isReady: boolean
  lastPing: number
}

interface Friend {
  id: string
  nickname: string
  avatar?: string
  isOnline?: boolean
}

interface WatchPartyProps {
  episodeId: string
  videoUrl: string
  animeTitle?: string
  onClose: () => void
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function WatchParty({ episodeId, videoUrl, animeTitle, onClose }: WatchPartyProps) {
  const [roomId, setRoomId] = useState<string>('')
  const [isHost, setIsHost] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [showFriendsList, setShowFriendsList] = useState(false)
  const [invitingFriend, setInvitingFriend] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ user: string; message: string; timestamp: number }>>([])
  const [chatInput, setChatInput] = useState('')
  const [nickname, setNickname] = useState('')
  const [showSetup, setShowSetup] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const channelRef = useRef<any>(null)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [])

  // Загрузка друзей
  const loadFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      setUserId(user.id)
      
      const { data } = await supabase
        .from('user_friends_full')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted')
      
      if (data) {
        const friendsList = data.map((f: any) => ({
          id: f.friend_id === user.id ? f.user_id : f.friend_id,
          nickname: f.friend_nickname || 'Друг',
          avatar: f.friend_avatar,
          isOnline: false, // Можно добавить через Realtime
        }))
        setFriends(friendsList)
      }
    } catch (e) {
      console.error('Load friends error:', e)
    }
  }

  // Приглашение друга
  const inviteFriend = async (friendId: string) => {
    if (!roomId || !userId) return
    
    setInvitingFriend(friendId)
    
    try {
      // Отправляем уведомление
      await supabase.rpc('send_watch_party_invite', {
        p_user_id: userId,
        p_friend_id: friendId,
        p_room_id: roomId,
        p_anime_title: animeTitle || 'Аниме',
      })
      
      alert('Приглашение отправлено!')
    } catch (e) {
      console.error('Invite error:', e)
      alert('Ошибка при отправке приглашения')
    } finally {
      setInvitingFriend(null)
      setShowFriendsList(false)
    }
  }

  const joinParty = async (room: string, asHost: boolean = false) => {
    if (!nickname.trim()) {
      alert('Введите ваше имя')
      return
    }

    setRoomId(room)
    setIsHost(asHost)
    setShowSetup(false)

    // Загружаем аватарку пользователя из профиля
    let userAvatar: string | undefined = undefined
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_identifier=eq.${user.email}`, {
          headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${session?.access_token}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0 && data[0].avatar) {
            userAvatar = data[0].avatar
          }
        }
      }
    } catch (e) {
      console.error('Load avatar error:', e)
    }

    // Подключаемся к Realtime каналу
    const channel = supabase.channel(`watchparty:${room}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const values = Object.values(state as any) || []
        const participantsList: Participant[] = values
          .flat()
          .filter((p: any) => p && p.id)
          .map((p: any) => ({
            id: p.id,
            nickname: p.nickname || 'Аноним',
            avatar: p.avatar,
            isReady: p.isReady ?? true,
            lastPing: p.lastPing || Date.now(),
          }))
        setParticipants(participantsList)
      })
      .on('broadcast', { event: 'video-update' }, (payload) => {
        const { time, playing, userId } = payload.payload
        if (userId !== nickname && videoRef.current) {
          videoRef.current.currentTime = time
          if (playing) {
            videoRef.current.play().catch(() => {})
          } else {
            videoRef.current.pause()
          }
          setCurrentTime(time)
          setIsPlaying(playing)
        }
      })
      .on('broadcast', { event: 'chat' }, (payload) => {
        setChatMessages(prev => [...prev, payload.payload])
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Присоединяемся к presence с аватаркой
          await channel.track({
            id: nickname,
            nickname,
            avatar: userAvatar,
            isReady: true,
            lastPing: Date.now(),
          })

          // Если хост, синхронизируем видео
          if (asHost && videoRef.current) {
            videoRef.current.addEventListener('timeupdate', () => {
              channel.send({
                type: 'broadcast',
                event: 'video-update',
                payload: {
                  time: videoRef.current?.currentTime || 0,
                  playing: !videoRef.current?.paused,
                  userId: nickname,
                },
              })
            })
          }
        }
      })

    channelRef.current = channel
  }

  const createParty = () => {
    const newRoomId = generateRoomId()
    setRoomId(newRoomId)
    joinParty(newRoomId, true)
    // Загружаем друзей после создания комнаты
    setTimeout(() => loadFriends(), 500)
  }

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
      
      if (channelRef.current && isHost) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'video-update',
          payload: {
            time: videoRef.current.currentTime,
            playing: !isPlaying,
            userId: nickname,
          },
        })
      }
    }
  }

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
      
      if (channelRef.current && isHost) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'video-update',
          payload: {
            time,
            playing: isPlaying,
            userId: nickname,
          },
        })
      }
    }
  }

  const sendChatMessage = () => {
    if (!chatInput.trim() || !channelRef.current) return
    
    const message = {
      user: nickname,
      message: chatInput,
      timestamp: Date.now(),
    }
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'chat',
      payload: message,
    })
    
    setChatMessages(prev => [...prev, message])
    setChatInput('')
  }

  const copyInviteLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?party=${roomId}`
    navigator.clipboard.writeText(url)
    alert('Ссылка скопирована! Отправьте её друзьям.')
  }

  if (showSetup) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="glass rounded-3xl p-4 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">🎉 Watch Party</h2>
          <p className="text-gray-400 text-center mb-6 text-sm sm:text-base">Смотрите аниме вместе с друзьями!</p>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Ваше имя</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Как вас называть?"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm"
                maxLength={20}
              />
            </div>

            <button
              onClick={createParty}
              className="w-full bg-neo-pink hover:bg-neo-pink/80 text-white py-3 rounded-xl font-semibold transition text-sm sm:text-base"
            >
              🎬 Создать комнату
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-neo-dark text-gray-400 text-xs">или</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Код комнаты"
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white uppercase text-sm"
                maxLength={6}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              />
              <button
                onClick={() => joinParty(roomId, false)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold transition text-sm sm:text-base whitespace-nowrap"
              >
                Войти
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-6 text-gray-400 hover:text-white text-sm w-full text-center"
          >
            ✕ Закрыть
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="glass border-b border-white/10 p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <h2 className="text-lg sm:text-xl font-bold text-white">🎉 Watch Party</h2>
          <span className="bg-neo-pink/20 text-neo-pink px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
            Комната: {roomId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isHost && participants.length > 0 && (
            <span className="text-xs text-gray-400 hidden sm:block">
              Пригласи друзей в панели справа 👉
            </span>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>
      </div>



      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Видео */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-black p-4">
            <video
              ref={videoRef}
              src={videoUrl}
              className="max-w-full max-h-full rounded-xl"
              onClick={handlePlayPause}
              onTimeUpdate={(e) => {
                if (isHost) {
                  setCurrentTime(e.currentTarget.currentTime)
                }
              }}
            />
          </div>

          {/* Контролы */}
          <div className="glass border-t border-white/10 p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlayPause}
                className="bg-neo-pink hover:bg-neo-pink/80 text-white w-12 h-12 rounded-full flex items-center justify-center transition"
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <input
                type="range"
                min="0"
                max={videoRef.current?.duration || 100}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="flex-1 accent-neo-pink"
              />
              <span className="text-white text-sm font-mono">
                {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Участники и чат */}
        <div className="w-full lg:w-80 glass border-l border-white/10 flex flex-col">
          {/* Участники */}
          <div className="p-4 border-b border-white/10">
            <h3 className="text-white font-semibold mb-3">
              👥 Участники ({participants.length})
            </h3>
            <div className="space-y-2">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.nickname} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neo-pink to-neo-red flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {p.nickname.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-white text-sm">{p.nickname}</span>
                  {p.id === nickname && (
                    <span className="text-xs text-gray-400">(вы)</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Пригласить друзей - только для хоста */}
          {isHost && (
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold text-sm">📩 Пригласить</h3>
                <span className="text-xs text-gray-400">{friends.length} друзей</span>
              </div>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={copyInviteLink}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-xs transition"
                >
                  📋 Ссылка
                </button>
                <button
                  onClick={() => setShowFriendsList(!showFriendsList)}
                  className="flex-1 bg-neo-pink/20 hover:bg-neo-pink/40 text-neo-pink py-2 rounded-lg text-xs transition"
                >
                  👥 Друзья
                </button>
              </div>
              
              {/* Список друзей */}
              {showFriendsList && (
                <div className="bg-white/5 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {friends.length === 0 ? (
                    <div className="text-center py-2">
                      <p className="text-gray-400 text-xs mb-1">Нет друзей</p>
                      <a
                        href="/profile"
                        target="_blank"
                        className="text-neo-pink text-xs hover:underline"
                      >
                        Добавить в профиле →
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {friends.map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between bg-white/5 rounded px-2 py-1.5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {friend.avatar ? (
                              <img src={friend.avatar} alt={friend.nickname} className="w-5 h-5 rounded-full flex-shrink-0" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-neo-pink/20 flex items-center justify-center text-neo-pink text-[10px] flex-shrink-0">
                                {friend.nickname[0].toUpperCase()}
                              </div>
                            )}
                            <span className="text-white text-[10px] truncate">{friend.nickname}</span>
                          </div>
                          <button
                            onClick={() => inviteFriend(friend.id)}
                            disabled={invitingFriend === friend.id}
                            className={`px-2 py-0.5 rounded text-[9px] font-medium transition flex-shrink-0 ml-2 ${
                              invitingFriend === friend.id
                                ? 'bg-gray-500 text-gray-300'
                                : 'bg-neo-pink hover:bg-neo-pink/80 text-white'
                            }`}
                          >
                            {invitingFriend === friend.id ? '⏳' : '➕'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Чат */}
          <div className="flex-1 flex flex-col p-4">
            <h3 className="text-white font-semibold mb-3">💬 Чат</h3>
            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="text-sm">
                  <span className="text-neo-pink font-medium">{msg.user}:</span>
                  <span className="text-gray-300 ml-2">{msg.message}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Сообщение..."
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm"
              />
              <button
                onClick={sendChatMessage}
                className="bg-neo-pink hover:bg-neo-pink/80 text-white px-4 py-2 rounded-xl transition"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
