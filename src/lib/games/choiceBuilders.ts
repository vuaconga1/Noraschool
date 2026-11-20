import type { WordItem } from "@/types/games";

export type ListenChooseQuestion = {
  audio: string;
  correct: string;
  options: string[];
  text: string;
};

export type LookChooseQuestion = {
  image: string;
  correct: string;
  options: string[];
  audio: string;
};

export type CatchWordItem = {
  image: string;
  audio: string;
  en: string;
  vi: string;
};

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function wordImage(word: WordItem): string | null {
  const icon = word.icon?.trim();
  return icon || null;
}

function wordAudio(word: WordItem): string {
  return (word.audioUrl || word.audio || "").trim();
}

/** Listen & Choose: hear word → pick correct image (needs ≥2 words with images). */
export function buildListenChooseQuestions(
  words: WordItem[],
): ListenChooseQuestion[] {
  const pool = words.filter((w) => wordImage(w));
  if (pool.length < 2) return [];

  return shuffle(pool).map((w) => {
    const correct = wordImage(w)!;
    const distractors = shuffle(pool.filter((x) => x.id !== w.id))
      .slice(0, 3)
      .map((x) => wordImage(x)!);
    const options = shuffle([correct, ...distractors]).slice(0, 4);
    return {
      audio: wordAudio(w),
      correct,
      options,
      text: w.text,
    };
  });
}

/** Look & Choose: see image → pick correct English word. */
export function buildLookChooseQuestions(
  words: WordItem[],
): LookChooseQuestion[] {
  const pool = words.filter((w) => wordImage(w) && w.text.trim());
  if (pool.length < 2) return [];

  const texts = pool.map((w) => w.text.trim());
  return shuffle(pool).map((w) => {
    const correct = w.text.trim();
    const distractors = shuffle(texts.filter((t) => t !== correct)).slice(0, 3);
    return {
      image: wordImage(w)!,
      correct,
      options: shuffle([correct, ...distractors]).slice(0, 4),
      audio: wordAudio(w),
    };
  });
}

/** Catching: falling vocab images with optional audio on catch. */
export function buildCatchWords(words: WordItem[]): CatchWordItem[] {
  return words
    .filter((w) => wordImage(w) && w.text.trim())
    .map((w) => ({
      image: wordImage(w)!,
      audio: wordAudio(w),
      en: w.text.trim(),
      vi: w.meaning?.trim() || "",
    }));
}
