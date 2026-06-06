'use client'
import { useFavorites } from '@/hooks/useFavorites'

export default function FavoriteButton({ animeId }: { animeId: string }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorite = isFavorite(animeId)

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite(animeId)
      }}
      className={`text-2xl transition-all duration-200 hover:scale-110 active:scale-95 ${
        favorite
          ? 'text-neo-purple drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]'
          : 'text-white/40 hover:text-neo-purple/70'
      }`}
      title={favorite ? 'Удалить из избранного' : 'В избранное'}
      aria-label={favorite ? 'Удалить из избранного' : 'В избранное'}
    >
      ♥
    </button>
  )
}