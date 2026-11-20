import { Routes } from "@/lib/constants/routes";

export async function logoutClient() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("auth-storage");
    } catch {
      // ignore
    }
    window.location.href = Routes.LOGIN;
  }
}

/** Alias used by header / UI */
export const handleLogout = logoutClient;
