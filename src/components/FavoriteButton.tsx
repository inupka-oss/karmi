'use client'
import { useFavorites } from '@/hooks/useFavorites'

export default function FavoriteButton({ animeId }: { animeId: string }) {
  const { isFavorite, toggleFavorite } = useFavorites()

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        toggleFavorite(animeId)
      }}
      className={`text-2xl transition ${
        isFavorite(animeId)
          ? 'text-neo-pink'
          : 'text-neo-pink/40 hover:text-neo-pink/70'
      }`}
      title="В избранное"
    >
      ♥
    </button>
  )
}