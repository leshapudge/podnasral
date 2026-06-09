import type { SessionStatus } from "@prisma/client";

export function getElapsedMs(
  activePlayMs: bigint,
  lastResumedAt: Date | null,
  status: SessionStatus,
  now = new Date(),
): bigint {
  if (status !== "PLAYING" || !lastResumedAt) {
    return activePlayMs;
  }
  const delta = BigInt(now.getTime() - lastResumedAt.getTime());
  return activePlayMs + delta;
}

export function msToHours(ms: bigint): number {
  return Number(ms) / (1000 * 60 * 60);
}

export function getProgressPct(elapsedMs: bigint, hltbMainHours: number): number {
  if (hltbMainHours <= 0) return 0;
  const targetMs = hltbMainHours * 60 * 60 * 1000;
  return Math.min(100, Math.round((Number(elapsedMs) / targetMs) * 100));
}
