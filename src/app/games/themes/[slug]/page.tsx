"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ForestPageShell } from "@/app/components/games/forest-background";
import { GameMobileToolbar } from "@/app/components/games/GameMobileToolbar";
import { ThemeAgeCards } from "@/app/components/games/ThemeAgeCards";
import { ThemeTopicsSidebar } from "@/app/components/games/ThemeTopicsSidebar";
import { ThemeWeekCards } from "@/app/components/games/ThemeWeekCards";
import {
  CURRICULUM_MONTHS,
  getCurriculumMonth,
  themeDisplayName,
  themeHasAgeBands,
} from "@/lib/curriculum-themes";

export default function ThemeMonthPage() {
  const params = useParams();
  const slug = String(params.slug ?? "");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const month = getCurriculumMonth(slug);

  if (!month) {
    return (
      <ForestPageShell showThemeSwitcher>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
          <p className="text-lg font-semibold text-slate-800">
            Không tìm thấy chủ đề này
          </p>
          <Link
            href={`/games/themes/${CURRICULUM_MONTHS[0]?.slug ?? ""}`}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Về chủ đề đầu tiên
          </Link>
        </div>
      </ForestPageShell>
    );
  }

  const useAges = themeHasAgeBands(month);

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
            title={themeDisplayName(month)}
            subtitle={useAges ? "Chọn độ tuổi" : "Chọn tuần học"}
          />
          {useAges ? (
            <ThemeAgeCards
              month={month}
              ageBands={month.ageBands}
              onOpenSidebar={() => setSidebarOpen(true)}
            />
          ) : (
            <ThemeWeekCards
              month={month}
              onOpenSidebar={() => setSidebarOpen(true)}
            />
          )}
        </div>
      </div>
    </ForestPageShell>
  );
}
