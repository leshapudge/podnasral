import { ARTIFACTS, getArtifactDef } from "./definitions";
import type { UnlockResult } from "./types";

export async function collectArtifactForUser(
  _userId: string,
  slug: string,
): Promise<UnlockResult> {
  const def = getArtifactDef(slug);
  if (!def) return { unlocked: false, slug };
  return { unlocked: true, slug, name: def.name, icon: def.icon };
}

export async function getUserArtifactSlugs(_userId: string): Promise<string[]> {
  return [];
}

export function buildArtifactCollection(foundSlugs: Set<string>) {
  return ARTIFACTS.map((a) => ({
    ...a,
    found: foundSlugs.has(a.slug),
  }));
}

export function getArtifactsForPage(pathname: string, foundSlugs: Set<string>) {
  return ARTIFACTS.filter(
    (a) => a.pages.includes(pathname) && !foundSlugs.has(a.slug),
  );
}

export function getArtifactPosition(slug: string, pathname: string) {
  let hash = 0;
  const key = `${slug}:${pathname}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const x = 10 + (Math.abs(hash) % 75);
  const y = 15 + (Math.abs(hash >> 8) % 65);
  return { left: `${x}%`, top: `${y}%` };
}
