"use client";

import type { UserRole } from "@prisma/client";
import { McAvatar } from "@/components/landing/os/mc-avatar";

interface UserMenuProps {
  nickname?: string | null;
  displayName?: string | null;
  image?: string | null;
  role: UserRole;
  primaryProvider?: string | null;
}

const roleLabels: Record<UserRole, string> = {
  VIEWER: "Зритель",
  STREAMER: "Стример",
  ADMIN: "Админ",
};

export function UserMenu({
  nickname,
  displayName,
  image,
  role,
  primaryProvider,
}: UserMenuProps) {
  const name = nickname ?? displayName ?? "Игрок";

  return (
    <div className="flex h-7 max-w-[130px] items-center gap-1.5 sm:max-w-[160px] sm:gap-2">
      <McAvatar nickname={name} src={image} size={20} />
      <div className="min-w-0 text-left leading-tight">
        <p className="truncate font-display text-[10px] uppercase tracking-wide text-[#e8d5b0]">
          {name}
        </p>
        <p className="truncate text-[9px] leading-none text-[#7a6a52]">
          {roleLabels[role]}
          {primaryProvider ? ` · ${primaryProvider}` : ""}
        </p>
      </div>
    </div>
  );
}
