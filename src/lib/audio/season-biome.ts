import type { SeasonBiome } from "./types";

/** Map season slug / name / config to landing-page biome ambience */
export function resolveSeasonBiome(input: {
  slug?: string | null;
  name?: string | null;
  config?: Record<string, unknown> | null;
}): SeasonBiome {
  const theme = typeof input.config?.theme === "string" ? input.config.theme.toLowerCase() : "";
  if (theme.includes("nether")) return "nether";
  if (theme.includes("end") || theme.includes("void")) return "end";
  if (theme.includes("snow") || theme.includes("ice") || theme.includes("frost")) return "snow";
  if (theme.includes("desert") || theme.includes("sand")) return "desert";
  if (theme.includes("forest") || theme.includes("emerald")) return "forest";

  const slug = (input.slug ?? "").toLowerCase();
  const name = (input.name ?? "").toLowerCase();
  const hay = `${slug} ${name}`;

  if (hay.includes("nether") || hay.includes("blaze") || hay.includes("bastion")) return "nether";
  if (hay.includes("end") || hay.includes("void") || hay.includes("dragon")) return "end";
  if (hay.includes("snow") || hay.includes("ice") || hay.includes("frost")) return "snow";
  if (hay.includes("desert") || hay.includes("sand") || hay.includes("dune")) return "desert";

  return "forest";
}

export function biomeToAmbientSound(biome: SeasonBiome) {
  const map: Record<SeasonBiome, `ambient.season.${SeasonBiome}`> = {
    forest: "ambient.season.forest",
    desert: "ambient.season.desert",
    snow: "ambient.season.snow",
    nether: "ambient.season.nether",
    end: "ambient.season.end",
  };
  return map[biome];
}
