import { useState } from 'react'
import { Star } from 'lucide-react'

type RatingStarsProps = {
  value?: number
  count?: number
  interactive?: boolean
  busy?: boolean
  onRate?: (rating: number) => void
}

export default function RatingStars({
  value = 0,
  count,
  interactive = false,
  busy = false,
  onRate,
}: RatingStarsProps) {
  const [hover, setHover] = useState<number | null>(null)
  const displayValue = hover ?? value

  return (
    <div className="flex items-center gap-1 text-xs text-slate-500">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = displayValue >= star - 0.25
        const color = filled ? '#f5c518' : '#d1d5db'

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              className="p-0"
              disabled={busy}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(null)}
              onClick={() => !busy && onRate?.(star)}
            >
              <Star className="h-4 w-4" strokeWidth={1.5} color={color} fill={color} />
            </button>
          )
        }

        return (
          <span key={star}>
            <Star className="h-4 w-4" strokeWidth={1.5} color={color} fill={color} />
          </span>
        )
      })}
      {count !== undefined && (
        <span className="ml-1">
          {count > 0 ? `${count} rating${count > 1 ? 's' : ''}` : 'No ratings'}
        </span>
      )}
    </div>
  )
}
