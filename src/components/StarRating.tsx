export default function StarRating({ rating, max = 10 }: { rating: number, max?: number }) {
  const stars = Math.round(rating)
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < stars ? 'text-yellow-400' : 'text-gray-600'}>★</span>
      ))}
      <span className="text-sm text-gray-400 ml-2">{rating}/10</span>
    </div>
  )
}