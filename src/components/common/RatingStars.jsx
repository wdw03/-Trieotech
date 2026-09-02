import React from 'react';
import { Star } from 'lucide-react';

export const RatingStars = ({ rating = 5, reviewCount = null, size = "sm", showValue = false, interactive = false, onRate = null }) => {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
  };

  const currentRating = Math.round(Number(rating) * 2) / 2;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFull = starIndex <= currentRating;
          const isHalf = !isFull && starIndex - 0.5 <= currentRating;

          return (
            <button
              key={starIndex}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRate && onRate(starIndex)}
              className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
              aria-label={`Rate ${starIndex} stars`}
            >
              <Star
                className={`${sizeClasses[size] || sizeClasses.sm} ${
                  isFull
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'fill-transparent text-stone-300 dark:text-stone-700'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
          {Number(rating).toFixed(1)}
        </span>
      )}

      {reviewCount !== null && (
        <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
          ({reviewCount})
        </span>
      )}
    </div>
  );
};

export default RatingStars;
