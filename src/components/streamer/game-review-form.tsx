"use client";

import { useState } from "react";
import { StarRatingInput } from "./star-rating";

interface GameReviewFormProps {
  gameTitle: string;
  finalScore?: number | null;
  loading?: boolean;
  onSubmit: (rating: number, review: string) => void | Promise<void>;
}

export function GameReviewForm({
  gameTitle,
  finalScore,
  loading,
  onSubmit,
}: GameReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const canSubmit = rating >= 1 && review.trim().length >= 3 && !loading;

  return (
    <div className="mx-auto max-w-lg space-y-5 rounded-lg border border-hypixel-gold/30 bg-[#1a1208]/60 p-5">
      <div className="text-center">
        <p className="font-display text-xs uppercase tracking-widest text-[#a89070]">
          Игра пройдена
        </p>
        <h3 className="mt-1 font-display text-lg text-[#e8d5b0]">{gameTitle}</h3>
        {finalScore != null && finalScore > 0 && (
          <p className="mt-2 font-display text-2xl text-hypixel-gold">+{finalScore} очков</p>
        )}
      </div>

      <div>
        <p className="mb-2 text-center text-xs text-[#7a6a52]">
          Оцените игру от 1 до 10 звёзд
        </p>
        <StarRatingInput value={rating} onChange={setRating} disabled={loading} />
      </div>

      <div>
        <label
          htmlFor="game-review"
          className="mb-2 block text-center text-xs text-[#7a6a52]"
        >
          Отзыв для зрителей
        </label>
        <textarea
          id="game-review"
          rows={4}
          maxLength={2000}
          value={review}
          disabled={loading}
          placeholder="Что понравилось, что нет, стоит ли другим проходить..."
          className="w-full resize-y rounded border border-[#2a2118] bg-[#0d0a08] px-3 py-2 text-sm text-[#e8d5b0] placeholder:text-[#5c4a32] focus:border-primary/50 focus:outline-none disabled:opacity-50"
          onChange={(e) => setReview(e.target.value)}
        />
        <p className="mt-1 text-right text-[10px] text-[#5c4a32]">
          {review.trim().length}/2000 · мин. 3 символа
        </p>
      </div>

      <button
        type="button"
        className="mc-os-btn mx-auto block px-8 py-2.5 text-xs"
        disabled={!canSubmit}
        onClick={() => void onSubmit(rating, review.trim())}
      >
        Отправить отзыв и открыть казино
      </button>
    </div>
  );
}
