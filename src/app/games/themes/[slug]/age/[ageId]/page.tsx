"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ForestPageShell } from "@/app/components/games/forest-background";
import { GameMobileToolbar } from "@/app/components/games/GameMobileToolbar";
import { ThemeTopicsSidebar } from "@/app/components/games/ThemeTopicsSidebar";
import { ThemeWeekCards } from "@/app/components/games/ThemeWeekCards";
import {
  ageBandDisplayName,
  getCurriculumAgeBand,
  themeDisplayName,
} from "@/lib/curriculum-themes";

export default function ThemeAgePage() {
  const params = useParams();
  const slug = String(params.slug ?? "");
  const ageId = decodeURIComponent(String(params.ageId ?? ""));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const resolved = useMemo(
    () => getCurriculumAgeBand(slug, ageId),
    [slug, ageId],
  );

  if (!resolved) {
    return (
      <ForestPageShell showThemeSwitcher>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
          <p className="text-lg font-semibold text-slate-800">
            Không tìm thấy nhóm tuổi này
          </p>
          <Link
            href={`/games/themes/${slug || ""}`}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Quay lại chọn độ tuổi
          </Link>
        </div>
      </ForestPageShell>
    );
  }

  const { month, ageBand } = resolved;

  return (
    <ForestPageShell showThemeSwitcher>
      <div className="flex min-h-dvh md:items-stretch">
        <ThemeTopicsSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeSlug={month.slug}
        />

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <GameMobileToolbar
            onBack={() => setSidebarOpen(true)}
            onOpenUnits={() => setSidebarOpen(true)}
            title={ageBandDisplayName(ageBand)}
            subtitle={themeDisplayName(month)}
          />
          <ThemeWeekCards
            month={month}
            ageBand={ageBand}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        </div>
      </div>
    </ForestPageShell>
  );
}
