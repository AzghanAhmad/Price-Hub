import { Star } from 'lucide-react';

interface Props {
  rating: number;
  size?: number;
  showValue?: boolean;
  count?: number;
}

export default function StarRating({ rating, size = 14, showValue = false, count }: Props) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= full;
        const half = i === full + 1 && hasHalf;
        return (
          <Star
            key={i}
            width={size}
            height={size}
            className={
              filled
                ? 'fill-amber-400 text-amber-400'
                : half
                ? 'fill-amber-200 text-amber-400'
                : 'fill-slate-200 text-slate-200'
            }
          />
        );
      })}
      {showValue && (
        <span className="ml-1 text-xs font-semibold text-slate-600">{rating.toFixed(1)}</span>
      )}
      {typeof count === 'number' && (
        <span className="ml-1 text-xs text-slate-400">({count})</span>
      )}
    </div>
  );
}
