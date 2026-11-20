"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useStudentStore } from "@/stores/student.store";
import { studentService } from "@/services/student.service";
import { fetchSessionMe } from "@/lib/client/session-me";

export default function AuthHydrator() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);
  const setStudentSession = useStudentStore((s) => s.setSession);
  const clearStudentSession = useStudentStore((s) => s.clearSession);
  const verifiedUsernameRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const user = await fetchSessionMe();
      if (cancelled) return;

      if (!user) {
        verifiedUsernameRef.current = null;
        clearUser();
        return;
      }

      setUser(user);

      const username = user.username?.trim();
      const isStudent = user.roles?.some(
        (r) => r.name?.toUpperCase() === "STUDENT",
      );
      if (!username || !isStudent) {
        clearStudentSession();
        return;
      }

      const current = useStudentStore.getState().session;
      if (current?.playerId.toLowerCase() === username.toLowerCase()) return;
      if (verifiedUsernameRef.current === username) return;
      verifiedUsernameRef.current = username;

      studentService
        .verifyPlayerId(username)
        .then(setStudentSession)
        .catch((err) => {
          verifiedUsernameRef.current = null;
          console.warn("[AuthHydrator] Không gắn được Mã HV:", err);
        });
    })();

    return () => {
      cancelled = true;
    };
  }, [setUser, clearUser, setStudentSession, clearStudentSession]);

  return null;
}
