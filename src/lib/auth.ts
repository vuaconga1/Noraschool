/**
 * Session auth via signed httpOnly cookie + bcrypt passwords.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type SessionRole = {
  id: string;
  name: string;
  isDisabled: boolean;
  permissions: { id: string; name: string }[];
};

export type SessionUser = {
  id: string;
  email: string | null;
  username: string | null;
  name: string;
  legacyRole: number;
  roles: SessionRole[];
};

const COOKIE_NAME = "wewin_cambridge_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 14;

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set to a string of at least 16 characters in production",
    );
  }
  return "wewin-cambridge-dev-session-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function encodeSession(user: SessionUser): string {
  const body = Buffer.from(
    JSON.stringify({
      ...user,
      exp: Date.now() + MAX_AGE_SEC * 1000,
    }),
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSession(token: string): SessionUser | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionUser & { exp?: number };
    if (data.exp && Date.now() > data.exp) return null;
    if (!data.id || !data.name) return null;
    return {
      id: data.id,
      email: data.email ?? null,
      username: data.username ?? null,
      name: data.name,
      legacyRole: data.legacyRole ?? 0,
      roles: data.roles ?? [],
    };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(user: SessionUser): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
});

export function mapUserToSession(user: {
  id: string;
  email: string | null;
  username: string | null;
  name: string;
  legacyRole: number;
  roles?: {
    id: string;
    name: string;
    isDisabled: boolean;
    permissions: { id: string; name: string }[];
  }[];
}): SessionUser {
  const roles =
    user.roles?.map((r) => ({
      id: r.id,
      name: r.name,
      isDisabled: r.isDisabled,
      permissions: r.permissions ?? [],
    })) ??
    [
      {
        id: user.legacyRole === 1 ? "teacher" : "student",
        name: user.legacyRole === 1 ? "TEACHER" : "STUDENT",
        isDisabled: false,
        permissions: [],
      },
    ];

  return {
    id: user.id,
    email: user.email ?? null,
    username: user.username,
    name: user.name,
    legacyRole: user.legacyRole,
    roles,
  };
}

export async function loadSessionUser(userId: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: { include: { permissions: true } },
    },
  });
  if (!user) return null;
  return mapUserToSession(user);
}

export class AuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("LOGIN_REQUIRED", "Cần đăng nhập");
  return user;
}

const STAFF_ROLE_NAMES = new Set([
  "ADMIN",
  "TEACHER",
  "STAFF",
  "SUPER_ADMIN",
  "MANAGER",
]);

export function isStaff(user: SessionUser): boolean {
  if (user.legacyRole === 1) return true;
  return user.roles.some(
    (r) => !r.isDisabled && STAFF_ROLE_NAMES.has(r.name.toUpperCase()),
  );
}

export function isAdmin(user: SessionUser): boolean {
  return user.roles.some(
    (r) =>
      !r.isDisabled &&
      (r.name.toUpperCase() === "ADMIN" || r.name.toUpperCase() === "SUPER_ADMIN"),
  );
}

export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isStaff(user)) {
    throw new AuthError("STAFF_REQUIRED", "Cần quyền giáo viên/admin");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isAdmin(user) && user.legacyRole !== 1) {
    // allow TEACHER+ADMIN style: staff with ADMIN role name
    if (!user.roles.some((r) => r.name.toUpperCase() === "ADMIN")) {
      throw new AuthError("FORBIDDEN", "Cần quyền admin");
    }
  }
  return user;
}

export function hasPermission(user: SessionUser, permission: string): boolean {
  if (isAdmin(user)) return true;
  return user.roles.some(
    (r) =>
      !r.isDisabled &&
      r.permissions.some((p) => p.name === permission || p.name === "*"),
  );
}
