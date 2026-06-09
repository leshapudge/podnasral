export function isEventLive(status: string, startsAt: Date | string): boolean {
  if (status === "ENDED") return false;
  if (status === "ACTIVE") return true;
  if (status === "UPCOMING") return new Date(startsAt).getTime() <= Date.now();
  return false;
}

export function isEventUpcoming(status: string, startsAt: Date | string): boolean {
  return status === "UPCOMING" && new Date(startsAt).getTime() > Date.now();
}

export function getDaysUntilStart(startsAt: Date | string): number {
  const ms = new Date(startsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function getEventPhaseLabel(status: string, progress: number): string {
  if (status === "UPCOMING") return "Скоро старт";
  if (status === "ENDED") return "Ивент завершён";
  return progress < 25
    ? "Начало сезона"
    : progress < 50
      ? "Разгар"
      : progress < 75
        ? "Mid-Season"
        : "Финал";
}
