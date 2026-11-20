"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

import {
  getSidebarSeasonStyle,
  useForestTheme,
} from "@/app/components/games/forest-background";
import { SeasonThemeIcon } from "@/app/components/games/forest-background/SeasonThemeIcon";
import { CherryBlossomDecor } from "@/app/components/games/CherryBlossomDecor";
import {
  CURRICULUM_MONTHS,
  themeDisplayName,
} from "@/lib/curriculum-themes";
import { NORA_SHELL } from "@/lib/brand";

type ThemeTopicsSidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
  activeSlug?: string;
};

/** Same visual language as BookUnitsSidebar / Starter Book — themes instead of units. */
export function ThemeTopicsSidebar({
  isOpen = false,
  onClose,
  activeSlug,
}: ThemeTopicsSidebarProps) {
  const pathname = usePathname();
  const { theme: season } = useForestTheme();
  const seasonUi = useMemo(() => getSidebarSeasonStyle(season), [season]);
  const [collapsed, setCollapsed] = useState(false);

  const theme = useMemo(
    () => ({
      asideBg: "backdrop-blur-md",
      headerFooterBg: seasonUi.headerBg,
      headerFooterText: "text-white",
      headerFooterSubText: seasonUi.headerSubText,
      border: "border-pink-200/70",
      itemText: "text-pink-900/70",
      itemTextActive: seasonUi.itemTextActive,
      itemActiveBg: seasonUi.itemActiveBg,
      itemHoverBg: "hover:bg-pink-100/70 hover:scale-[1.01]",
      iconBoxBg: "bg-pink-100 text-pink-800",
      iconBoxActiveBg: seasonUi.iconBoxActiveBg,
      iconColor: seasonUi.iconColor,
      toggleBtnBg: seasonUi.toggleBtnBg,
    }),
    [seasonUi],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 768) {
      document.body.style.overflow = isOpen ? "hidden" : "";
      return () => {
        document.body.style.overflow = "";
      };
    }
    return undefined;
  }, [isOpen]);

  const widthClass = collapsed ? "w-72 md:w-[56px]" : "w-72";

  const isActive = (slug: string) => {
    if (activeSlug) return activeSlug === slug;
    return (
      pathname === `/games/themes/${slug}` ||
      pathname.startsWith(`/games/themes/${slug}/`)
    );
  };

  const asideClasses = `fixed md:static top-0 left-0 h-dvh md:h-auto md:min-h-full md:self-stretch flex flex-col ${widthClass} ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} md:flex overflow-visible z-[60] md:z-10`;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={asideClasses}>
        <div className="relative h-full w-full">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={`absolute right-0 top-1/2 z-20 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-white shadow-xl transition-all hover:scale-105 md:flex ${theme.toggleBtnBg}`}
            aria-label={
              collapsed ? "Mở rộng danh sách chủ đề" : "Thu gọn danh sách chủ đề"
            }
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>

          <div
            className={`relative flex h-full w-full flex-col overflow-hidden border-r ${theme.border} ${theme.asideBg} shadow-xl transition-all duration-300`}
            style={{ backgroundColor: NORA_SHELL.sidebarBg }}
          >
            <CherryBlossomDecor />
            {collapsed ? (
              <div
                className={`relative z-10 flex h-full items-center justify-center overflow-hidden ${theme.headerFooterBg}`}
              >
                <span
                  className="pointer-events-none absolute left-1 top-3 text-lg opacity-80"
                  aria-hidden
                >
                  <SeasonThemeIcon config={seasonUi} size={18} />
                </span>
                <span
                  className="pointer-events-none absolute bottom-4 right-1 text-base opacity-70"
                  aria-hidden
                >
                  <SeasonThemeIcon config={seasonUi} size={16} />
                </span>
                <div className="rotate-90 whitespace-nowrap text-xs font-extrabold tracking-wider text-white">
                  CHỦ ĐỀ
                </div>
              </div>
            ) : (
              <>
                <div
                  className={`relative z-10 flex flex-shrink-0 items-center gap-3 overflow-hidden px-4 py-4 ${theme.headerFooterBg}`}
                >
                  <span
                    className="pointer-events-none absolute -right-1 -top-1 rotate-[18deg] text-2xl opacity-90 drop-shadow-sm"
                    aria-hidden
                  >
                    <SeasonThemeIcon config={seasonUi} size={22} />
                  </span>
                  <span
                    className="pointer-events-none absolute bottom-1 right-8 rotate-[-12deg] text-sm opacity-70"
                    aria-hidden
                  >
                    <SeasonThemeIcon config={seasonUi} size={14} />
                  </span>

                  <div
                    className="relative z-10 flex h-9 w-9 items-center justify-center rounded-2xl bg-white shadow-sm ring-2 ring-white/40"
                    style={{ boxShadow: `0 0 0 2px ${seasonUi.accent}55` }}
                  >
                    <BookOpen className={`h-5 w-5 ${theme.iconColor}`} />
                  </div>
                  <div className="relative z-10 min-w-0 flex-1">
                    <div
                      className={`text-sm font-extrabold tracking-wide ${theme.headerFooterText}`}
                    >
                      Chủ đề học
                    </div>
                    <div
                      className={`text-[11px] font-medium ${theme.headerFooterSubText}`}
                    >
                      Chọn chủ đề để chuyển nhanh
                    </div>
                  </div>
                  {onClose ? (
                    <button
                      type="button"
                      onClick={onClose}
                      className="relative z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/20 md:hidden"
                      aria-label="Đóng danh sách chủ đề"
                    >
                      <X className={`h-5 w-5 ${theme.headerFooterText}`} />
                    </button>
                  ) : null}
                </div>

                <nav className="relative z-10 flex-1 space-y-2 overflow-y-auto p-3">
                  {CURRICULUM_MONTHS.map((month, idx) => {
                    const href = `/games/themes/${month.slug}`;
                    const active = isActive(month.slug);
                    const name = themeDisplayName(month);

                    return (
                      <Link
                        key={month.slug}
                        href={href}
                        replace
                        onClick={() => {
                          if (
                            typeof window !== "undefined" &&
                            window.innerWidth < 768
                          ) {
                            onClose?.();
                          }
                        }}
                        className={`group flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 ${
                          active
                            ? theme.itemActiveBg
                            : "rounded-xl " + theme.itemHoverBg
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                            active ? theme.iconBoxActiveBg : theme.iconBoxBg
                          }`}
                        >
                          {(idx + 1).toString().padStart(2, "0")}
                        </div>
                        <span
                          className={`min-w-0 flex-1 text-[14px] font-bold uppercase line-clamp-2 ${
                            active
                              ? theme.itemTextActive
                              : theme.itemText
                          }`}
                        >
                          {name}
                        </span>
                        {active ? (
                          <span
                            className="pointer-events-none shrink-0 text-base opacity-90"
                            aria-hidden
                          >
                            <SeasonThemeIcon config={seasonUi} size={18} />
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </nav>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
