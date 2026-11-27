import themesJson from "@/data/curriculum-themes.json";
import type { UnitGameConfig, WordItem } from "@/types/games";
import { DEFAULT_ENABLED_GAMES } from "@/types/games";

export type CurriculumWeekTheme = {
  weekIndex: number;
  label: string;
  isReview: boolean;
  words: string[];
};

export type CurriculumAgeBand = {
  id: string;
  labelVi: string;
  labelEn: string;
  weeks: CurriculumWeekTheme[];
};

export type CurriculumMonthTheme = {
  slug: string;
  year: number;
  month: number;
  titleVi: string;
  titleEn: string;
  topicPlan: string | null;
  weeks: CurriculumWeekTheme[];
  ageBands?: CurriculumAgeBand[];
};

/** Full curriculum JSON — keep for later unlocks / import scripts. */
const ALL_CURRICULUM_MONTHS = themesJson as CurriculumMonthTheme[];

/**
 * Public themes shown in UI. Only Career is live for now;
 * other months stay in JSON so they can be re-enabled by slug.
 */
const VISIBLE_THEME_SLUGS = new Set(["2026-11"]);

export const CURRICULUM_MONTHS = ALL_CURRICULUM_MONTHS.filter((m) =>
  VISIBLE_THEME_SLUGS.has(m.slug),
);

/** 1-based theme number in the full year plan (Career = 03). */
export function themePlanNumber(month: CurriculumMonthTheme): number {
  const idx = ALL_CURRICULUM_MONTHS.findIndex((m) => m.slug === month.slug);
  return idx >= 0 ? idx + 1 : 1;
}

const VI_MONTHS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
] as const;

/** Accent bands for month cards — warm/cool cycle, avoid purple-default look */
export const MONTH_CARD_ACCENTS = [
  { from: "#0EA5E9", to: "#0369A1", soft: "#E0F2FE" },
  { from: "#10B981", to: "#047857", soft: "#D1FAE5" },
  { from: "#F59E0B", to: "#B45309", soft: "#FEF3C7" },
  { from: "#EF4444", to: "#B91C1C", soft: "#FEE2E2" },
  { from: "#14B8A6", to: "#0F766E", soft: "#CCFBF1" },
  { from: "#EC4899", to: "#BE185D", soft: "#FFF0F5" },
  { from: "#079EFB", to: "#1D4ED8", soft: "#DBEAFE" },
  { from: "#84CC16", to: "#4D7C0F", soft: "#ECFCCB" },
  { from: "#F97316", to: "#C2410C", soft: "#FFEDD5" },
  { from: "#06B6D4", to: "#0E7490", soft: "#CFFAFE" },
  { from: "#EAB308", to: "#A16207", soft: "#FEF9C3" },
  { from: "#22C55E", to: "#15803D", soft: "#DCFCE7" },
] as const;

export function getCurriculumMonth(slug: string): CurriculumMonthTheme | undefined {
  return CURRICULUM_MONTHS.find((m) => m.slug === slug);
}

export function themeHasAgeBands(
  month: CurriculumMonthTheme,
): month is CurriculumMonthTheme & { ageBands: CurriculumAgeBand[] } {
  return Array.isArray(month.ageBands) && month.ageBands.length > 0;
}

export function getCurriculumAgeBand(
  slug: string,
  ageId: string,
): { month: CurriculumMonthTheme; ageBand: CurriculumAgeBand } | undefined {
  const month = getCurriculumMonth(slug);
  if (!month?.ageBands?.length) return undefined;
  const ageBand = month.ageBands.find((b) => b.id === ageId);
  if (!ageBand) return undefined;
  return { month, ageBand };
}

export function getCurriculumWeek(
  slug: string,
  weekIndex: number,
): { month: CurriculumMonthTheme; week: CurriculumWeekTheme } | undefined {
  const month = getCurriculumMonth(slug);
  if (!month) return undefined;
  const week = month.weeks.find((w) => w.weekIndex === weekIndex);
  if (!week) return undefined;
  return { month, week };
}

export function getCurriculumAgeWeek(
  slug: string,
  ageId: string,
  weekIndex: number,
):
  | {
      month: CurriculumMonthTheme;
      ageBand: CurriculumAgeBand;
      week: CurriculumWeekTheme;
    }
  | undefined {
  const resolved = getCurriculumAgeBand(slug, ageId);
  if (!resolved) return undefined;
  const week = resolved.ageBand.weeks.find((w) => w.weekIndex === weekIndex);
  if (!week) return undefined;
  return { month: resolved.month, ageBand: resolved.ageBand, week };
}

export function formatMonthLabel(month: number, year: number): string {
  const name = VI_MONTHS[month - 1] ?? `Tháng ${month}`;
  return `${name}/${year}`;
}

/** Sidebar / heading: theme name only — never include month/year */
export function themeDisplayName(month: CurriculumMonthTheme): string {
  return (month.titleEn || month.titleVi).trim();
}

export function themeDisplayNameVi(month: CurriculumMonthTheme): string {
  return (month.titleVi || month.titleEn).trim();
}

export function ageBandDisplayName(ageBand: CurriculumAgeBand): string {
  return (ageBand.labelVi || ageBand.labelEn).trim();
}

export const DEFAULT_THEME_SLUG = CURRICULUM_MONTHS[0]?.slug ?? "2026-11";

export function monthAccent(index: number) {
  return MONTH_CARD_ACCENTS[index % MONTH_CARD_ACCENTS.length];
}

/** Map curriculum labels → approved asset stems when names differ. */
const WORD_STEM_ALIASES: Record<string, string> = {
  firefighter: "fireman",
  // police-officer.png is a mislabeled pilot asset; use police.png instead.
  "police-officer": "police",
};

function wordFileStem(word: string): string {
  // Drop teacher-only notes so asset slugs stay clean (e.g. "sydney opera house chỉ dành cho…").
  const cleaned = word
    .trim()
    .toLowerCase()
    .replace(/\s+chỉ\s+dành\s+cho\b.*$/u, "")
    .replace(/\s+\d+\s*-\s*\d+\s*yo\b.*$/u, "")
    .trim();
  const stem = cleaned.replace(/\s+/g, "-");
  return WORD_STEM_ALIASES[stem] ?? stem;
}

function displayWord(word: string): string {
  return word
    .trim()
    .replace(/\s+chỉ\s+dành\s+cho\b.*$/iu, "")
    .replace(/\s+\d+\s*-\s*\d+\s*yo\b.*$/iu, "")
    .trim();
}

function buildWordItems(words: string[]): WordItem[] {
  return words.map((text, i) => {
    const label = displayWord(text);
    const stem = wordFileStem(text);
    return {
      id: `${stem}-${i}`,
      text: label,
      icon: `/assets/vocab/approved/${stem}.png`,
      audioUrl: `/assets/vocab/audio/${stem}.mp3`,
    };
  });
}

export function buildWeekUnitConfig(
  month: CurriculumMonthTheme,
  week: CurriculumWeekTheme,
  ageBand?: CurriculumAgeBand,
): UnitGameConfig {
  const words = buildWordItems(week.words);
  const topic = themeDisplayName(month);
  const ageLabel = ageBand ? ageBandDisplayName(ageBand) : null;
  const title = ageLabel
    ? `${topic} · ${ageLabel} · Tuần ${week.weekIndex}`
    : `${topic} · Tuần ${week.weekIndex}`;
  const pairs = words.map((w) => ({
    left: w.text,
    right: w.meaning || w.text,
  }));
  const slug = ageBand
    ? `${month.slug}-${ageBand.id}-w${week.weekIndex}`
    : `${month.slug}-w${week.weekIndex}`;

  return {
    slug,
    name: title,
    unit: ageLabel ? `${ageLabel} · Week ${week.weekIndex}` : `Week ${week.weekIndex}`,
    bookname: topic,
    flashcards: { title: `Flashcards · ${title}`, words, autoAudio: true },
    matching: { title: `Matching · ${title}`, pairs, showScore: true },
    wordOrdering: { title: `Ordering · ${title}`, words, showScore: true },
    wordScramble: { title: `Scramble · ${title}`, words, showScore: true },
    enabledGames: DEFAULT_ENABLED_GAMES,
    parts: [
      {
        id: "week",
        title: week.isReview
          ? `Ôn tập · Tuần ${week.weekIndex}`
          : ageLabel
            ? `${ageLabel} · Tuần ${week.weekIndex}`
            : `Tuần ${week.weekIndex}`,
        words,
        enabledGames: DEFAULT_ENABLED_GAMES,
      },
    ],
  };
}
