export function buildSecretRouteKey(pathname: string, tab: string | null): string {
  if (pathname === "/") {
    const normalized = (tab ?? "").trim();
    if (!normalized || normalized === "overview") return "/?tab=overview";
    if (normalized === "secrets") return "/?tab=achievements";
    return `/?tab=${normalized}`;
  }
  return pathname;
}
