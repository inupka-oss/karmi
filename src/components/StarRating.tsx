export default function StarRating({ rating, max = 10 }: { rating: number, max?: number }) {
  const stars = Math.round(rating)
  const normalizedRating = rating / max * 10
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <span 
            key={i} 
            className={`text-base ${
              i < stars 
                ? 'text-yellow-400 drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]' 
                : 'text-gray-600'
            }`}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-sm font-medium text-gray-300 ml-2">{rating.toFixed(1)}/{max}</span>
    </div>
  )
}