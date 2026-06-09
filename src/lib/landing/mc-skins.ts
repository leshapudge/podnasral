import { mcAvatarUrl } from "./assets";

/**
 * Twitch login → Minecraft-ник с уникальным скином на mc-heads.net.
 * Если ника нет в маппинге — используем avatar из профиля (Dicebear и т.д.).
 */
export const STREAMER_MC_SKINS: Record<string, string> = {
  karmikkoala: "Notch",
  melharucos: "jeb_",
  xnestorio: "Dinnerbone",
  dream: "Dream",
  technoblade: "Technoblade",
};

export function resolveMcSkinName(twitchLogin?: string | null): string | null {
  if (!twitchLogin) return null;
  return STREAMER_MC_SKINS[twitchLogin.toLowerCase()] ?? null;
}

export function resolveStreamerHeadUrl(opts: {
  twitchLogin?: string | null;
  nickname: string;
  avatarUrl?: string | null;
  size?: number;
}): string {
  const skin = resolveMcSkinName(opts.twitchLogin);
  if (skin) return mcAvatarUrl(skin, opts.size ?? 32);
  if (opts.avatarUrl) return opts.avatarUrl;
  return mcAvatarUrl(opts.nickname, opts.size ?? 32);
}
