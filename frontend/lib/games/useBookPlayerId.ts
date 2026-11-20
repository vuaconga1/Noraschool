"use client";

import { useState, useEffect, useCallback } from "react";
import { useStudentStore } from "@/stores/student.store";

function readBookPlayerId(storageKey: string): string {
  if (typeof window === "undefined") return "";
  const saved = localStorage.getItem(storageKey) || "";
  if (!saved || saved === "anonymous") return "guest";
  return saved;
}

type UseBookPlayerIdOptions = {
  storageKey: string;
  reloadFlagKey: string;
  onReloadClear?: () => void;
};

/**
 * Player ID for game screens. Modal entry was removed — uses student session
 * when available, otherwise guest / saved local id.
 */
export function useBookPlayerId({
  storageKey,
  reloadFlagKey,
  onReloadClear,
}: UseBookPlayerIdOptions) {
  const studentSession = useStudentStore((s) => s.session);
  void reloadFlagKey;
  void onReloadClear;

  const [playerId, setPlayerId] = useState<string>(() => {
    if (typeof window === "undefined") return "guest";
    const globalId = useStudentStore.getState().session?.playerId;
    return globalId || readBookPlayerId(storageKey) || "guest";
  });

  useEffect(() => {
    if (studentSession?.playerId) {
      setPlayerId(studentSession.playerId);
      localStorage.setItem(storageKey, studentSession.playerId);
      return;
    }
    const saved = readBookPlayerId(storageKey);
    setPlayerId(saved || "guest");
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, "guest");
    }
  }, [studentSession, storageKey]);

  const handlePlayerIdSubmit = useCallback(
    (id: string) => {
      setPlayerId(id);
      localStorage.setItem(storageKey, id);
    },
    [storageKey],
  );

  const handlePlayerIdSkip = useCallback(() => {
    setPlayerId("guest");
    localStorage.setItem(storageKey, "guest");
  }, [storageKey]);

  return {
    playerId,
    showIdModal: false,
    handlePlayerIdSubmit,
    handlePlayerIdSkip,
    setShowIdModal: (_open: boolean) => {},
  };
}
