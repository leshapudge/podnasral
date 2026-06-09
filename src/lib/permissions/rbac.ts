import type { UserRole } from "@prisma/client";
import { forbidden, unauthorized } from "@/lib/api/errors";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type Resource =
  | "users"
  | "events"
  | "participants"
  | "catalog-games"
  | "items"
  | "craft-recipes"
  | "craft-ingredients"
  | "bosses"
  | "game-sessions"
  | "activity-logs";

type PermissionRule = {
  roles: UserRole[];
  public?: boolean;
  ownOnly?: boolean;
  ownerField?: string;
};

const ALL_ROLES: UserRole[] = ["VIEWER", "STREAMER", "ADMIN"];
const ADMIN_ONLY: UserRole[] = ["ADMIN"];

const permissions: Record<Resource, Partial<Record<HttpMethod, PermissionRule>>> = {
  users: {
    GET: { roles: ADMIN_ONLY },
    POST: { roles: ADMIN_ONLY },
    PATCH: { roles: ADMIN_ONLY },
    DELETE: { roles: ADMIN_ONLY },
  },
  events: {
    GET: { roles: ALL_ROLES, public: true },
    POST: { roles: ADMIN_ONLY },
    PATCH: { roles: ADMIN_ONLY },
    DELETE: { roles: ADMIN_ONLY },
  },
  participants: {
    GET: { roles: ALL_ROLES, public: true },
    POST: { roles: ADMIN_ONLY },
    PATCH: { roles: ADMIN_ONLY },
    DELETE: { roles: ADMIN_ONLY },
  },
  "catalog-games": {
    GET: { roles: ALL_ROLES, public: true },
    POST: { roles: ADMIN_ONLY },
    PATCH: { roles: ADMIN_ONLY },
    DELETE: { roles: ADMIN_ONLY },
  },
  items: {
    GET: { roles: ALL_ROLES, public: true },
    POST: { roles: ADMIN_ONLY },
    PATCH: { roles: ADMIN_ONLY },
    DELETE: { roles: ADMIN_ONLY },
  },
  "craft-recipes": {
    GET: { roles: ALL_ROLES, public: true },
    POST: { roles: ADMIN_ONLY },
    PATCH: { roles: ADMIN_ONLY },
    DELETE: { roles: ADMIN_ONLY },
  },
  "craft-ingredients": {
    GET: { roles: ALL_ROLES, public: true },
    POST: { roles: ADMIN_ONLY },
    PATCH: { roles: ADMIN_ONLY },
    DELETE: { roles: ADMIN_ONLY },
  },
  bosses: {
    GET: { roles: ALL_ROLES, public: true },
    POST: { roles: ADMIN_ONLY },
    PATCH: { roles: ADMIN_ONLY },
    DELETE: { roles: ADMIN_ONLY },
  },
  "game-sessions": {
    GET: { roles: ADMIN_ONLY },
  },
  "activity-logs": {
    GET: { roles: ADMIN_ONLY },
  },
};

export function getPermissionRule(resource: Resource, method: HttpMethod): PermissionRule {
  const rule = permissions[resource]?.[method];
  if (!rule) throw forbidden(`No permission rule for ${resource} ${method}`);
  return rule;
}

export function assertRole(role: UserRole | undefined, resource: Resource, method: HttpMethod) {
  const rule = getPermissionRule(resource, method);
  if (rule.public) return rule;
  if (!role || !rule.roles.includes(role)) throw forbidden();
  return rule;
}

export function isStaff(role: UserRole) {
  return role === "ADMIN";
}

export function buildOwnershipFilter(
  rule: PermissionRule,
  role: UserRole,
  userId: string,
): Record<string, string> | undefined {
  if (!rule.ownOnly || isStaff(role)) return undefined;
  const field = rule.ownerField ?? "userId";
  return { [field]: userId };
}

export function assertOwnership(
  rule: PermissionRule,
  role: UserRole,
  userId: string,
  record: Record<string, unknown>,
) {
  if (!rule.ownOnly || isStaff(role)) return;
  const field = rule.ownerField ?? "userId";
  if (record[field] !== userId) throw forbidden();
}
