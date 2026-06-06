'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

interface CollectionCard {
  id: string
  anime_id: string
  anime_title: string
  anime_poster: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  obtained_at: string
  special_effect?: string
}

const rarityConfig = {
  common: { 
    label: 'Обычная', 
    color: 'from-gray-500 to-gray-600', 
    bg: 'bg-gray-500/20',
    border: 'border-gray-500/50',
    glow: 'shadow-gray-500/20',
  },
  rare: { 
    label: 'Редкая', 
    color: 'from-blue-500 to-blue-600', 
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    glow: 'shadow-blue-500/20',
  },
  epic: { 
    label: 'Эпическая', 
    color: 'from-neo-purple to-neo-purple-light', 
    bg: 'bg-neo-purple/20',
    border: 'border-neo-purple/50',
    glow: 'shadow-neo-purple/20',
  },
  legendary: { 
    label: 'Легендарная', 
    color: 'from-yellow-500 to-orange-500', 
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    glow: 'shadow-yellow-500/20',
  },
}

const rarityIcons = {
  common: '⚪',
  rare: '💎',
  epic: '🔮',
  legendary: '👑',
}

export default function CollectionCards({ userId }: { userId?: string }) {
  const [cards, setCards] = useState<CollectionCard[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null)
  const [filter, setFilter] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  useEffect(() => {
    const loadCards = async () => {
      if (!userId) {
        // Для гостей показываем заглушку
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // Загружаем коллекционные карточки пользователя
        const res = await fetch(`${supabaseUrl}/rest/v1/collection_cards?user_id=eq.${userId}&select=*`, {
          headers: { 'apikey': supabaseAnonKey },
        })
        
        if (res.ok) {
          const userCards = await res.json()
          
          // Получаем информацию об аниме
          const animeIds = [...new Set(userCards.map((c: CollectionCard) => c.anime_id))]
          if (animeIds.length > 0) {
            const animeRes = await fetch(`${supabaseUrl}/rest/v1/anime?id=in.(${animeIds.join(',')})&select=id,title_ru,poster_url`, {
              headers: { 'apikey': supabaseAnonKey },
            })
            if (animeRes.ok) {
              const animeData = await animeRes.json()
              const animeMap = new Map<string, { title_ru: string; poster_url: string }>(
                animeData.map((a: any) => [a.id, { title_ru: a.title_ru, poster_url: a.poster_url }])
              )
              
              const enrichedCards = userCards.map((c: CollectionCard) => ({
                ...c,
                anime_title: animeMap.get(c.anime_id)?.title_ru || 'Неизвестно',
                anime_poster: animeMap.get(c.anime_id)?.poster_url || '/placeholder.jpg',
              }))
              
              setCards(enrichedCards)
            }
          }
        }
      } catch (e) {
        console.error('Load cards error:', e)
      } finally {
        setLoading(false)
      }
    }

    loadCards()
  }, [userId, supabaseUrl, supabaseAnonKey])

  const filteredCards = filter === 'all' ? cards : cards.filter(c => c.rarity === filter)

  const getRarityCount = (rarity: string) => {
    return cards.filter(c => c.rarity === rarity).length
  }

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          🎴 Коллекционные карточки
          <span className="text-xs sm:text-sm font-normal text-gray-400">
            ({cards.length} шт.)
          </span>
        </h2>
        
        {/* Фильтры по редкости - скролл на мобильных */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {Object.entries(rarityConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex-shrink-0 px-2 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filter === key
                  ? `${config.bg} ${config.border} border text-white`
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">{rarityIcons[key as keyof typeof rarityIcons]} {config.label}</span>
              <span className="sm:hidden">{rarityIcons[key as keyof typeof rarityIcons]}</span>
              <span className="ml-1 text-[10px]">({getRarityCount(key)})</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] glass rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎴</div>
          <p className="text-gray-400 mb-4">
            {userId ? 'У вас пока нет коллекционных карточек' : 'Войдите чтобы коллекционировать карточки'}
          </p>
          <p className="text-sm text-gray-500">
            Карточки выпадают за просмотр аниме, комментарии и достижения
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredCards.map((card) => {
              const config = rarityConfig[card.rarity]
              return (
                <button
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className={`group relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden border-2 ${config.border} ${config.bg} hover:shadow-lg ${config.glow} transition-all duration-300 hover:scale-105`}
                >
                  {/* Постер аниме */}
                  <Image
                    src={card.anime_poster}
                    alt={card.anime_title}
                    fill
                    className="object-cover opacity-80 group-hover:opacity-100 transition"
                  />
                  
                  {/* Градиент редкости */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-20 group-hover:opacity-30 transition`} />
                  
                  {/* Иконка редкости */}
                  <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-xl sm:text-2xl">
                    {rarityIcons[card.rarity]}
                  </div>
                  
                  {/* Название */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black to-transparent">
                    <p className="text-white text-xs sm:text-sm font-semibold truncate">{card.anime_title}</p>
                    <p className="text-[10px] sm:text-xs text-gray-400">{config.label}</p>
                  </div>
                  
                  {/* Блик при наведении */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition pointer-events-none transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] duration-700" />
                </button>
              )
            })}
          </div>

          {/* Модальное окно карточки */}
          {selectedCard && (
            <div 
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedCard(null)}
            >
              <div 
                className="relative max-w-sm w-full glass rounded-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedCard(null)}
                  className="absolute top-3 right-3 z-10 text-white/50 hover:text-white text-2xl"
                >
                  ✕
                </button>
                
                <div className="aspect-[3/4] relative">
                  <Image
                    src={selectedCard.anime_poster}
                    alt={selectedCard.anime_title}
                    fill
                    className="object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${rarityConfig[selectedCard.rarity].color} opacity-30`} />
                </div>
                
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{rarityIcons[selectedCard.rarity]}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${rarityConfig[selectedCard.rarity].bg}`}>
                      {rarityConfig[selectedCard.rarity].label}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{selectedCard.anime_title}</h3>
                  
                  <p className="text-gray-400 text-xs mb-4">
                    Получено {new Date(selectedCard.obtained_at).toLocaleDateString('ru-RU')}
                  </p>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>🎴 #{selectedCard.id.slice(0, 8)}</span>
                    <span>✨ Уникальный дизайн</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
