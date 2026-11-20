"use client";

import Link from "next/link";
import {
  formatMonthLabel,
  monthAccent,
  type CurriculumMonthTheme,
} from "@/lib/curriculum-themes";

type Props = {
  month: CurriculumMonthTheme;
  index: number;
};

export function ThemeMonthCard({ month, index }: Props) {
  const accent = monthAccent(index);
  const wordCount = month.weeks.reduce((n, w) => n + w.words.length, 0);

  return (
    <Link
      href={`/games/themes/${month.slug}`}
      aria-label={`${formatMonthLabel(month.month, month.year)} — ${month.titleVi}`}
      className="group relative flex h-full min-h-[200px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[0_12px_28px_rgba(15,23,42,0.14)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.2)] sm:min-h-[220px]"
    >
      <div
        className="relative px-4 pb-3 pt-4 text-white"
        style={{
          background: `linear-gradient(145deg, ${accent.from} 0%, ${accent.to} 100%)`,
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">
          {formatMonthLabel(month.month, month.year)}
        </p>
        <h2 className="mt-1 text-lg font-bold leading-tight drop-shadow-sm sm:text-xl">
          {month.titleVi}
        </h2>
        <p className="mt-0.5 text-sm font-medium text-white/90">{month.titleEn}</p>
        <div
          className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
        />
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 px-4 py-3">
        <div className="grid grid-cols-4 gap-1.5">
          {month.weeks.map((week) => (
            <div
              key={week.weekIndex}
              className="rounded-lg px-1 py-2 text-center"
              style={{ background: accent.soft }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Tuần
              </p>
              <p className="text-base font-bold" style={{ color: accent.to }}>
                {week.weekIndex}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
          <span>{wordCount} từ vựng</span>
          <span className="text-[11px] font-semibold transition-colors group-hover:text-slate-900">
            Chọn tháng →
          </span>
        </div>
      </div>
    </Link>
  );
}
