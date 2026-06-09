import { NextResponse } from "next/server";
import { AppError, handleError } from "./errors";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function success<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  const body: ApiSuccessResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  return NextResponse.json(body, { status });
}

export function created<T>(data: T) {
  return success(data, undefined, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function errorResponse(error: AppError) {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    },
  };
  return NextResponse.json(body, { status: error.status });
}

export function handleApiError(error: unknown) {
  return errorResponse(handleError(error));
}
