export const APP_TABS = [
  { slug: "kazik", label: "Казик" },
  { slug: "overview", label: "Стримеры" },
  { slug: "inventory", label: "Инвентарь" },
  { slug: "items", label: "Предметы" },
  { slug: "season", label: "Сезон" },
  { slug: "boss", label: "Босс" },
  { slug: "achievements", label: "Достижения" },
] as const;

/** Вкладки без кнопки в навбаре (профиль открывается по клику на аватар). */
export const HIDDEN_APP_TABS = [{ slug: "profile", label: "Профиль" }] as const;

export type AppTabSlug =
  | (typeof APP_TABS)[number]["slug"]
  | (typeof HIDDEN_APP_TABS)[number]["slug"];

export function resolveTabSlug(value: string | null): AppTabSlug {
  if (value === "profile") return "profile";
  if (value === "feed") return "overview";
  if (value === "secrets") return "achievements";
  if (value === "arcade") return "kazik";
  const found = APP_TABS.find((t) => t.slug === value);
  return found?.slug ?? "overview";
}

export function tabLabel(slug: AppTabSlug): string {
  return APP_TABS.find((t) => t.slug === slug)?.label ?? "Обзор";
}
