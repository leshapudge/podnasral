import type { MouseEvent } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface TwitchStreamButtonProps {
  login: string;
  isLive?: boolean;
  variant?: "full" | "icon";
  className?: string;
  onClick?: (e: MouseEvent) => void;
}

export function TwitchStreamButton({
  login,
  isLive = false,
  variant = "full",
  className,
  onClick,
}: TwitchStreamButtonProps) {
  const href = `https://www.twitch.tv/${encodeURIComponent(login)}`;

  if (variant === "icon") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={isLive ? `Смотреть стрим ${login}` : `Канал ${login} на Twitch`}
        aria-label={isLive ? `Смотреть стрим ${login}` : `Канал ${login} на Twitch`}
        onClick={onClick}
        className={cn(
          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border transition-colors",
          isLive
            ? "border-[#9146FF]/60 bg-[#9146FF]/20 hover:bg-[#9146FF]/35"
            : "border-[#373737]/80 bg-[#1a1208]/80 hover:border-[#9146FF]/50 hover:bg-[#9146FF]/15",
          className,
        )}
      >
        <Image src="/assets/mc/social/twitch.svg" alt="" width={14} height={14} />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={cn(
        "mc-os-btn inline-flex items-center gap-2 px-4 py-2 text-xs",
        isLive && "border-[#9146FF]/70 bg-[#9146FF]/15 text-[#e8d5b0] hover:border-[#9146FF]",
        className,
      )}
    >
      <Image src="/assets/mc/social/twitch.svg" alt="" width={16} height={16} />
      {isLive ? "Смотреть стрим" : "Канал на Twitch"}
    </a>
  );
}
