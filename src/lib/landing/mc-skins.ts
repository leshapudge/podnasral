import { mcAvatarUrl } from "./assets";

/**
 * Twitch login → Minecraft-ник для mc-heads (опционально).
 * Если ника нет — показываем Twitch-аватар из профиля (image в ростере / user.image).
 */
export const STREAMER_MC_SKINS: Record<string, string> = {};

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
