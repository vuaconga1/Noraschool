"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LockKeyhole, LogOut } from "lucide-react";

import { handleLogout } from "@/lib/auth/logout";
import { Routes } from "@/lib/constants/routes";
import { useAuthStore } from "@/stores/auth.store";

const btnClass =
  "flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/50 bg-white/80 px-2.5 text-[#af4e80] shadow-md backdrop-blur-md transition hover:bg-white hover:scale-105 sm:h-10 sm:px-3";

/** Compact login / account chip for fullscreen game shell (no global navbar). */
export function ForestAuthControl() {
  const user = useAuthStore((s) => s.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [menuOpen]);

  if (!user) {
    return (
      <Link
        href={Routes.LOGIN}
        aria-label="Đăng nhập"
        title="Đăng nhập"
        className={`${btnClass} font-bold`}
      >
        <LockKeyhole className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" />
        <span className="hidden text-xs sm:inline sm:text-sm">Đăng nhập</span>
      </Link>
    );
  }

  const initial = (user.name?.charAt(0) || user.username?.charAt(0) || "?").toUpperCase();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Tài khoản"
        aria-expanded={menuOpen}
        title={user.name || user.username || "Tài khoản"}
        className={btnClass}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#e85a9b] via-[#ffb7c5] to-[#079efb] text-[11px] font-bold text-white shadow-sm ring-1 ring-white/60 sm:h-7 sm:w-7 sm:text-xs">
          {initial}
        </span>
        <span className="hidden max-w-[7rem] truncate text-xs font-bold sm:inline sm:text-sm">
          {user.name || user.username}
        </span>
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-11 z-50 min-w-[10rem] overflow-hidden rounded-2xl border border-white/60 bg-white/95 py-1 shadow-xl backdrop-blur-md">
          <div className="border-b border-slate-100 px-4 py-2.5">
            <p className="truncate text-sm font-bold text-slate-800">
              {user.name || user.username}
            </p>
            {user.email ? (
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              void handleLogout();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-pink-50 hover:text-[#BE185D]"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      ) : null}
    </div>
  );
}
