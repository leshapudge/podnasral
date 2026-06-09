import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import type { z } from "zod";
import { auth } from "@/lib/auth/auth";
import {
  assertRole,
  buildOwnershipFilter,
  type HttpMethod,
  type Resource,
} from "@/lib/permissions/rbac";
import { badRequest, unauthorized } from "./errors";
import { created, handleApiError, noContent, success } from "./response";

export interface ApiContext {
  req: NextRequest;
  session: Session | null;
  userId: string | null;
  userRole: Session["user"]["role"] | null;
  params: Record<string, string>;
}

type RouteHandler = (ctx: ApiContext) => Promise<Response>;

async function executeHandler(
  resource: Resource,
  method: HttpMethod,
  handler: RouteHandler,
  req: NextRequest,
  params: Record<string, string>,
  options?: { requireAuth?: boolean },
) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const userRole = session?.user?.role ?? null;

  const rule = assertRole(userRole ?? undefined, resource, method);

  if (options?.requireAuth !== false && !rule.public && !userId) {
    throw unauthorized();
  }

  return handler({
    req,
    session: session ?? null,
    userId,
    userRole,
    params,
  });
}

export function withApiHandler(
  resource: Resource,
  method: HttpMethod,
  handler: RouteHandler,
  options?: { requireAuth?: boolean },
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      return await executeHandler(resource, method, handler, req, {}, options);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function withApiHandlerById(
  resource: Resource,
  method: HttpMethod,
  handler: RouteHandler,
  options?: { requireAuth?: boolean },
) {
  return async (
    req: NextRequest,
    context: { params: Promise<{ id: string }> },
  ): Promise<Response> => {
    try {
      const params = await context.params;
      return await executeHandler(resource, method, handler, req, params, options);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export async function parseBody<T extends z.ZodType>(
  req: NextRequest,
  schema: T,
): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw badRequest("Invalid JSON body");
  }
  return schema.parse(body);
}

export function getOwnershipWhere(
  resource: Resource,
  method: HttpMethod,
  userRole: Session["user"]["role"] | null,
  userId: string | null,
) {
  if (!userRole || !userId) return undefined;
  const rule = assertRole(userRole, resource, method);
  return buildOwnershipFilter(rule, userRole, userId);
}

export { success, created, noContent };
