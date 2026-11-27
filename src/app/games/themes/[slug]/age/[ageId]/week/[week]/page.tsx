"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { UnitGameScreen } from "@/app/components/games/UnitGameScreen";
import { ThemeTopicsSidebar } from "@/app/components/games/ThemeTopicsSidebar";
import { ForestPageShell } from "@/app/components/games/forest-background";
import { leaderboardPathForBookType } from "@/lib/games/bookRoutes";
import {
  ageBandDisplayName,
  buildWeekUnitConfig,
  getCurriculumAgeWeek,
  themeDisplayName,
  themeDisplayNameVi,
} from "@/lib/curriculum-themes";

export default function ThemeAgeWeekGamePage() {
  const params = useParams();
  const slug = String(params.slug ?? "");
  const ageId = decodeURIComponent(String(params.ageId ?? ""));
  const weekIndex = Number(params.week);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const resolved = useMemo(
    () => getCurriculumAgeWeek(slug, ageId, weekIndex),
    [slug, ageId, weekIndex],
  );

  const unit = useMemo(() => {
    if (!resolved) return null;
    return buildWeekUnitConfig(resolved.month, resolved.week, resolved.ageBand);
  }, [resolved]);

  if (!resolved || !unit) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg font-semibold text-slate-800">
          Không tìm thấy tuần học này
        </p>
        <Link
          href={`/games/themes/${slug || ""}`}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Quay lại chọn độ tuổi
        </Link>
      </div>
    );
  }

  const { month, ageBand, week } = resolved;
  const topicName = themeDisplayName(month);
  const ageLabel = ageBandDisplayName(ageBand);
  const agePath = `/games/themes/${month.slug}/age/${encodeURIComponent(ageBand.id)}`;

  return (
    <ForestPageShell
      showThemeSwitcher
      leaderboardHref={leaderboardPathForBookType(unit.bookType)}
    >
      <div className="flex min-h-dvh md:items-stretch">
        <ThemeTopicsSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeSlug={month.slug}
        />

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <UnitGameScreen
            embedded
            onOpenUnitsSidebar={() => setSidebarOpen(true)}
            unit={unit}
            heading={`${topicName} · ${ageLabel} · Tuần ${week.weekIndex}`}
            subheading={themeDisplayNameVi(month)}
            showBreadcrumb
            breadcrumbBackUrl={agePath}
            breadcrumbBackLabel="Chọn tuần"
            unitPath={`${agePath}/week/${week.weekIndex}`}
          />
        </div>
      </div>
    </ForestPageShell>
  );
}
