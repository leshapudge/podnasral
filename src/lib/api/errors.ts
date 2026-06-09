import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ApiError = AppError;

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  BAD_REQUEST: "BAD_REQUEST",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export function unauthorized(message = "Authentication required") {
  return new AppError(401, ErrorCodes.UNAUTHORIZED, message);
}

export function forbidden(message = "Insufficient permissions") {
  return new AppError(403, ErrorCodes.FORBIDDEN, message);
}

export function notFound(entity = "Resource") {
  return new AppError(404, ErrorCodes.NOT_FOUND, `${entity} not found`);
}

export function conflict(message: string) {
  return new AppError(409, ErrorCodes.CONFLICT, message);
}

export function badRequest(message: string, details?: unknown) {
  return new AppError(400, ErrorCodes.BAD_REQUEST, message, details);
}

export function fromZodError(error: ZodError) {
  return new AppError(400, ErrorCodes.VALIDATION_ERROR, "Validation failed", error.flatten());
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) return fromZodError(error);

  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as { code: string; meta?: { target?: string[] } };
    if (prismaError.code === "P2002") {
      return conflict(`Unique constraint failed on: ${prismaError.meta?.target?.join(", ") ?? "field"}`);
    }
    if (prismaError.code === "P2025") return notFound();
    if (prismaError.code === "P2003") return badRequest("Related record does not exist");
  }

  console.error("[API Error]", error);
  return new AppError(500, ErrorCodes.INTERNAL_ERROR, "Internal server error");
}

export function jsonError(error: unknown) {
  const appError = handleError(error);
  return Response.json(
    {
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.details !== undefined ? { details: appError.details } : {}),
      },
    },
    { status: appError.status },
  );
}
