import themesJson from "@/data/curriculum-themes.json";
import type { UnitGameConfig, WordItem } from "@/types/games";
import { DEFAULT_ENABLED_GAMES } from "@/types/games";

export type CurriculumWeekTheme = {
  weekIndex: number;
  label: string;
  isReview: boolean;
  words: string[];
};

export type CurriculumMonthTheme = {
  slug: string;
  year: number;
  month: number;
  titleVi: string;
  titleEn: string;
  topicPlan: string | null;
  weeks: CurriculumWeekTheme[];
};

/** Full curriculum JSON — keep for later unlocks / import scripts. */
const ALL_CURRICULUM_MONTHS = themesJson as CurriculumMonthTheme[];

/**
 * Public themes shown in UI. Only New Schoolyear is live for now;
 * other months stay in JSON so they can be re-enabled by slug.
 */
const VISIBLE_THEME_SLUGS = new Set(["2026-09"]);

export const CURRICULUM_MONTHS = ALL_CURRICULUM_MONTHS.filter((m) =>
  VISIBLE_THEME_SLUGS.has(m.slug),
);

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

export const DEFAULT_THEME_SLUG = CURRICULUM_MONTHS[0]?.slug ?? "2026-09";

export function monthAccent(index: number) {
  return MONTH_CARD_ACCENTS[index % MONTH_CARD_ACCENTS.length];
}

function wordFileStem(word: string): string {
  // Drop teacher-only notes so asset slugs stay clean (e.g. "sydney opera house chỉ dành cho…").
  const cleaned = word
    .trim()
    .toLowerCase()
    .replace(/\s+chỉ\s+dành\s+cho\b.*$/u, "")
    .replace(/\s+\d+\s*-\s*\d+\s*yo\b.*$/u, "")
    .trim();
  return cleaned.replace(/\s+/g, "-");
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
): UnitGameConfig {
  const words = buildWordItems(week.words);
  const topic = themeDisplayName(month);
  const title = `${topic} · Tuần ${week.weekIndex}`;
  const pairs = words.map((w) => ({
    left: w.text,
    right: w.meaning || w.text,
  }));

  return {
    slug: `${month.slug}-w${week.weekIndex}`,
    name: title,
    unit: `Week ${week.weekIndex}`,
    bookname: topic,
    flashcards: { title: `Flashcards · ${title}`, words, autoAudio: true },
    matching: { title: `Matching · ${title}`, pairs, showScore: true },
    wordOrdering: { title: `Ordering · ${title}`, words, showScore: true },
    wordScramble: { title: `Scramble · ${title}`, words, showScore: true },
    enabledGames: DEFAULT_ENABLED_GAMES,
    parts: [
      {
        id: "week",
        title: week.isReview ? `Ôn tập · Tuần ${week.weekIndex}` : `Tuần ${week.weekIndex}`,
        words,
        enabledGames: DEFAULT_ENABLED_GAMES,
      },
    ],
  };
}
