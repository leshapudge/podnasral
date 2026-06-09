"use client";

import { useEffect, useState } from "react";
import { resolveStreamerHeadUrl } from "@/lib/landing/mc-skins";
import { cn } from "@/lib/utils";

interface McAvatarProps {
  nickname: string;
  twitchLogin?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
}

const FALLBACK = "/assets/mc/fallback-game.svg";

export function McAvatar({
  nickname,
  twitchLogin,
  src: avatarSrc,
  size = 28,
  className,
}: McAvatarProps) {
  const resolved = resolveStreamerHeadUrl({
    twitchLogin,
    nickname,
    avatarUrl: avatarSrc,
    size,
  });

  const [src, setSrc] = useState(resolved);

  useEffect(() => {
    setSrc(
      resolveStreamerHeadUrl({
        twitchLogin,
        nickname,
        avatarUrl: avatarSrc,
        size,
      }),
    );
  }, [twitchLogin, nickname, avatarSrc, size]);

  return (
    <div
      className={cn("mc-slot shrink-0 overflow-hidden", className)}
      style={{ width: size + 4, height: size + 4 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={nickname}
        width={size}
        height={size}
        className="mc-pixel-image h-full w-full object-cover"
        onError={() => {
          if (avatarSrc && src !== avatarSrc) {
            setSrc(avatarSrc);
          } else if (src !== FALLBACK) {
            setSrc(FALLBACK);
          }
        }}
      />
    </div>
  );
}
