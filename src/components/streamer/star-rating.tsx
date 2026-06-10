"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
}

export function StarRatingInput({
  value,
  onChange,
  max = 10,
  disabled,
}: StarRatingInputProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {Array.from({ length: max }, (_, i) => {
        const score = i + 1;
        const active = score <= (hover || value);
        return (
          <button
            key={score}
            type="button"
            disabled={disabled}
            className={cn(
              "rounded p-0.5 transition-transform hover:scale-110 disabled:opacity-50",
              active ? "text-hypixel-gold" : "text-[#3d3024]",
            )}
            onMouseEnter={() => setHover(score)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(score)}
            title={`${score} из ${max}`}
          >
            <Star className={cn("h-6 w-6 sm:h-7 sm:w-7", active && "fill-current")} />
          </button>
        );
      })}
      <span className="ml-2 font-display text-lg text-hypixel-gold">
        {value > 0 ? `${value}/${max}` : "—"}
      </span>
    </div>
  );
}

interface StarRatingDisplayProps {
  rating: number;
  max?: number;
  size?: "sm" | "md";
}

export function StarRatingDisplay({ rating, max = 10, size = "sm" }: StarRatingDisplayProps) {
  const iconClass = size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <span className="inline-flex items-center gap-0.5 text-hypixel-gold" title={`${rating}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn(iconClass, i < rating ? "fill-current" : "text-[#3d3024]")}
        />
      ))}
      <span className="ml-1 font-display text-xs">{rating}</span>
    </span>
  );
}
