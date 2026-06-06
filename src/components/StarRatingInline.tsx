'use client'

interface StarRatingInlineProps {
  animeId: string
  currentRating: number | undefined
  onRate: (animeId: string, rating: number) => void
}

export default function StarRatingInline({ animeId, currentRating, onRate }: StarRatingInlineProps) {
  const stars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  return (
    <div className="flex items-center gap-0.5 mt-1">
      <span className="text-xs text-gray-400 mr-1">Рейтинг:</span>
      {stars.map(star => (
        <button
          key={star}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRate(animeId, star)
          }}
          className={`text-sm transition-all duration-150 hover:scale-125 ${
            currentRating && star <= currentRating 
              ? 'text-yellow-400 drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]' 
              : 'text-gray-600 hover:text-yellow-300'
          }`}
          title={`Оценить на ${star}`}
          aria-label={`Оценить на ${star} из 10`}
        >
          ★
        </button>
      ))}
      {currentRating && (
        <span className="text-xs text-gray-400 ml-1">{currentRating}/10</span>
      )}
    </div>
  )
}