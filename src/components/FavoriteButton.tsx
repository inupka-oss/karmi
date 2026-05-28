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
      className={`text-2xl ${isFavorite(animeId) ? 'text-red-500' : 'text-gray-400'} hover:text-red-400 transition`}
      title="В избранное"
    >
      ♥
    </button>
  )
}