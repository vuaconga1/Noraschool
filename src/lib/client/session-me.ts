"use client";

import type { AuthUser } from "@/types/auth-user";

export type MeResponse = {
  user: AuthUser;
};

export async function fetchSessionMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as MeResponse;
    return data.user ?? null;
  } catch {
    return null;
  }
}
