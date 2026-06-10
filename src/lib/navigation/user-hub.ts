import type { UserRole } from "@prisma/client";

/** Куда вести стримера/админа по клику на аватар в шапке OS. */
export function isStreamerHubRole(role?: UserRole | null): boolean {
  return role === "STREAMER" || role === "ADMIN";
}

export function streamerHubPath(role?: UserRole | null): string | null {
  return isStreamerHubRole(role) ? "/streamer" : null;
}

/** Куда отправить после входа, если callbackUrl не задан. */
export function defaultLoginRedirect(role?: UserRole | null): string {
  return isStreamerHubRole(role) ? "/streamer" : "/?tab=kazik";
}
