import type { z } from "zod";
import { notFound, forbidden } from "@/lib/api/errors";
import { paginationMeta } from "@/lib/api/pagination";
import {
  withApiHandler,
  withApiHandlerById,
  parseBody,
  getOwnershipWhere,
  success,
  created,
  noContent,
  type ApiContext,
} from "@/lib/api/handler";
import {
  assertOwnership,
  getPermissionRule,
  isStaff,
  type Resource,
} from "@/lib/permissions/rbac";
import { idParamSchema } from "@/lib/validators/common";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaDelegate = {
  findMany: (args?: any) => Promise<any[]>;
  findUnique: (args: any) => Promise<any | null>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
  count: (args?: any) => Promise<number>;
};

export interface CrudConfig<TList extends z.ZodType, TCreate extends z.ZodType, TUpdate extends z.ZodType> {
  resource: Resource;
  entityLabel: string;
  delegate: PrismaDelegate;
  listQuerySchema: TList;
  createSchema: TCreate;
  updateSchema: TUpdate;
  filterFields?: string[];
  searchField?: string;
  defaultOrderBy?: Record<string, "asc" | "desc">;
  include?: Record<string, boolean | object>;
  injectUserIdOnCreate?: boolean;
  userIdField?: string;
  beforeCreate?: (data: z.infer<TCreate>, ctx: ApiContext) => z.infer<TCreate> | Promise<z.infer<TCreate>>;
  beforeUpdate?: (
    data: z.infer<TUpdate>,
    ctx: ApiContext,
    existing: Record<string, unknown>,
  ) => z.infer<TUpdate> | Promise<z.infer<TUpdate>>;
  canDelete?: (existing: Record<string, unknown>, ctx: ApiContext) => void | Promise<void>;
}

function buildWhereFromQuery(
  query: Record<string, unknown>,
  filterFields: string[],
  search?: string,
  searchField?: string,
) {
  const where: Record<string, unknown> = {};

  for (const field of filterFields) {
    const value = query[field];
    if (value !== undefined && value !== null && value !== "") {
      if (field === "search" && searchField && typeof value === "string") {
        where[searchField] = { contains: value, mode: "insensitive" };
        continue;
      }
      if (
        field !== "page" &&
        field !== "limit" &&
        field !== "sortBy" &&
        field !== "sortOrder" &&
        field !== "search"
      ) {
        where[field] = value;
      }
    }
  }

  if (search && searchField) {
    where[searchField] = { contains: search, mode: "insensitive" };
  }

  return where;
}

export function createCrudHandlers<TList extends z.ZodType, TCreate extends z.ZodType, TUpdate extends z.ZodType>(
  config: CrudConfig<TList, TCreate, TUpdate>,
) {
  const {
    resource,
    entityLabel,
    delegate,
    listQuerySchema,
    createSchema,
    updateSchema,
    filterFields = [],
    searchField,
    defaultOrderBy = { createdAt: "desc" },
    include,
    injectUserIdOnCreate = false,
    userIdField = "userId",
  } = config;

  const list = withApiHandler(resource, "GET", async ({ req, userRole, userId }) => {
    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = listQuerySchema.parse(raw);
    const { page, limit, sortBy, sortOrder, ...filters } = query as Record<string, unknown>;

    const ownershipWhere =
      userRole && userId ? getOwnershipWhere(resource, "GET", userRole, userId) : undefined;

    const where = {
      ...buildWhereFromQuery(
        filters as Record<string, unknown>,
        filterFields,
        filters.search as string | undefined,
        searchField,
      ),
      ...ownershipWhere,
    };

    const orderBy = sortBy
      ? { [sortBy as string]: sortOrder as "asc" | "desc" }
      : defaultOrderBy;

    const skip = ((page as number) - 1) * (limit as number);

    const [items, total] = await Promise.all([
      delegate.findMany({
        where,
        skip,
        take: limit as number,
        orderBy,
        ...(include ? { include } : {}),
      }),
      delegate.count({ where }),
    ]);

    return success(items, paginationMeta(page as number, limit as number, total));
  });

  const getById = withApiHandlerById(resource, "GET", async ({ userRole, userId, params }) => {
    const { id } = idParamSchema.parse(params);

    const item = await delegate.findUnique({
      where: { id },
      ...(include ? { include } : {}),
    });

    if (!item) throw notFound(entityLabel);

    if (userRole && userId) {
      const rule = getPermissionRule(resource, "GET");
      assertOwnership(rule, userRole, userId, item as Record<string, unknown>);
    }

    return success(item);
  });

  const create = withApiHandler(resource, "POST", async (ctx) => {
    let data = await parseBody(ctx.req, createSchema);

    if (injectUserIdOnCreate && ctx.userId) {
      const record = data as Record<string, unknown>;
      if (!record[userIdField]) {
        record[userIdField] = ctx.userId;
      } else if (!isStaff(ctx.userRole!) && record[userIdField] !== ctx.userId) {
        throw forbidden("Cannot create records for other users");
      }
    }

    if (config.beforeCreate) {
      data = await config.beforeCreate(data, ctx);
    }

    const item = await delegate.create({
      data,
      ...(include ? { include } : {}),
    });

    return created(item);
  });

  const update = withApiHandlerById(resource, "PATCH", async (ctx) => {
    const { id } = idParamSchema.parse(ctx.params);
    const data = await parseBody(ctx.req, updateSchema);

    const existing = await delegate.findUnique({ where: { id } });
    if (!existing) throw notFound(entityLabel);

    if (ctx.userRole && ctx.userId) {
      const rule = getPermissionRule(resource, "PATCH");
      assertOwnership(rule, ctx.userRole, ctx.userId, existing as Record<string, unknown>);
    }

    let updateData = data;
    if (config.beforeUpdate) {
      updateData = await config.beforeUpdate(data, ctx, existing as Record<string, unknown>);
    }

    const item = await delegate.update({
      where: { id },
      data: updateData,
      ...(include ? { include } : {}),
    });

    return success(item);
  });

  const remove = withApiHandlerById(resource, "DELETE", async (ctx) => {
    const { id } = idParamSchema.parse(ctx.params);

    const existing = await delegate.findUnique({ where: { id } });
    if (!existing) throw notFound(entityLabel);

    if (ctx.userRole && ctx.userId) {
      const rule = getPermissionRule(resource, "DELETE");
      assertOwnership(rule, ctx.userRole, ctx.userId, existing as Record<string, unknown>);
    }

    if (config.canDelete) {
      await config.canDelete(existing as Record<string, unknown>, ctx);
    }

    await delegate.delete({ where: { id } });
    return noContent();
  });

  return { list, getById, create, update, remove };
}
