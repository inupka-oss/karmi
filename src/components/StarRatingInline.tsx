'use client'

interface StarRatingInlineProps {
  animeId: string
  currentRating: number | undefined
  onRate: (animeId: string, rating: number) => void
}

export default function StarRatingInline({ animeId, currentRating, onRate }: StarRatingInlineProps) {
  const stars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  return (
    <div className="flex gap-0.5 mt-1">
      {stars.map(star => (
        <button
          key={star}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRate(animeId, star)
          }}
          className={`text-xs ${
            currentRating && star <= currentRating ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-300'
          } transition`}
          title={`Оценить на ${star}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}