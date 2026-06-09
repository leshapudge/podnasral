export function formatTimeRemaining(endsAt: Date): string {
  const ms = endsAt.getTime() - Date.now();
  if (ms <= 0) return "Завершён";

  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) return `${days}д ${hours}ч ${mins}м`;
  return `${hours}ч ${mins}м`;
}

export function formatRelativeTime(date: Date): string {
  const ms = Date.now() - date.getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "только что";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} мин назад`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн назад`;
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function formatDateRu(date: Date): string {
  return date.toLocaleDateString("ru-RU", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function formatDateRuLong(date: Date | string): string {
  return new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function formatDurationMs(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h}ч ${m}м`;
  if (h > 0) return `${h}ч`;
  return `${m}м`;
}

export function formatHltbHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0 && m > 0) return `${h}ч ${m}м`;
  if (h > 0) return `${h}ч`;
  return `${m}м`;
}

export function getSeasonPhase(progress: number): string {
  if (progress < 25) return "Начало сезона";
  if (progress < 50) return "Разгар";
  if (progress < 75) return "Mid-Season";
  return "Финал";
}
