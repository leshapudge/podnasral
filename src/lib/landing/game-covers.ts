/** Steam header — стабильный CDN, не протухает как старые RAWG-ссылки */
const steam = (appId: number) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;

/**
 * Обложки игр для лендинга.
 * Приоритет: Steam → актуальный RAWG background_image (проверено 2026-06).
 */
export const GAME_COVERS: Record<string, string> = {
  "Pilot Brothers": steam(263360),
  "Hollow Knight": steam(367520),
  Minecraft:
    "https://media.rawg.io/media/games/b4e/b4e4c73d5aa4ec66bbf75375c4847a2b.jpg",
  Subnautica: steam(264710),
  Terraria: steam(105600),
  "Hardcore MC":
    "https://media.rawg.io/media/games/b4e/b4e4c73d5aa4ec66bbf75375c4847a2b.jpg",
  "Stardew Valley": steam(413150),
  "Portal 2": steam(620),
  "GTA V": steam(271590),
  Celeste: steam(504230),
  Raft: steam(648800),
  "Among Us": steam(945360),
};

export const GAME_COVER_FALLBACK = "/assets/mc/fallback-game.svg";

export function getGameCoverUrl(title: string): string {
  return GAME_COVERS[title] ?? GAME_COVER_FALLBACK;
}

/** Обложка: каталог → маппинг по названию → fallback */
export function resolveGameCover(title: string, coverImage?: string | null): string {
  if (coverImage) return coverImage;
  return getGameCoverUrl(title);
}
