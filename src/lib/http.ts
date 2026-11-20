import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    { code, message, error: message, ...extra },
    { status },
  );
}

export function handleRouteError(err: unknown) {
  if (err instanceof AuthError) {
    const status =
      err.code === "LOGIN_REQUIRED"
        ? 401
        : err.code === "FORBIDDEN" || err.code === "STAFF_REQUIRED"
          ? 403
          : 401;
    return jsonError(err.code, err.message, status);
  }
  if (err instanceof ZodError) {
    const first = err.issues[0];
    return jsonError(
      "VALIDATION_ERROR",
      first?.message ?? "Dữ liệu không hợp lệ",
      400,
      { issues: err.issues.map((i) => ({ path: i.path, message: i.message })) },
    );
  }
  if (err instanceof Error) {
    const msg = err.message;
    if (msg === "NOT_FOUND") return jsonError("NOT_FOUND", "Không tìm thấy", 404);
    if (msg === "CONFLICT") return jsonError("CONFLICT", "Dữ liệu trùng", 409);
    console.error(err);
    return jsonError("INTERNAL_ERROR", "Lỗi máy chủ", 500);
  }
  console.error(err);
  return jsonError("INTERNAL_ERROR", "Lỗi máy chủ", 500);
}
