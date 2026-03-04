"use client";

interface RatingStarsProps {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

export function RatingStars({ value, onChange, size = "md" }: RatingStarsProps) {
  const isInteractive = !!onChange;

  const handleClick = (star: number) => {
    if (!onChange) return;
    // 同じ星を再クリックでクリア
    onChange(value === star ? null : star);
  };

  return (
    <div className="flex gap-1" role="group" aria-label="評価">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!isInteractive}
          onClick={() => handleClick(star)}
          className={`${sizeClasses[size]} transition-colors disabled:cursor-default ${
            isInteractive ? "cursor-pointer hover:scale-110" : ""
          } ${value !== null && star <= value ? "text-yellow-400" : "text-gray-300"}`}
          aria-label={`${star}つ星`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
