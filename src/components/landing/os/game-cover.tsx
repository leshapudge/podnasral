"use client";

import { useEffect, useState } from "react";
import { getGameCoverUrl, GAME_COVER_FALLBACK } from "@/lib/landing/game-covers";
import { cn } from "@/lib/utils";

interface GameCoverProps {
  title: string;
  className?: string;
}

export function GameCover({ title, className }: GameCoverProps) {
  const [src, setSrc] = useState(() => getGameCoverUrl(title));

  useEffect(() => {
    setSrc(getGameCoverUrl(title));
  }, [title]);

  return (
    <div
      className={cn(
        "game-cover-frame relative aspect-[460/215] overflow-hidden",
        "w-full max-w-[200px]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover object-center"
        onError={() => {
          if (src !== GAME_COVER_FALLBACK) setSrc(GAME_COVER_FALLBACK);
        }}
      />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/40" />
    </div>
  );
}
