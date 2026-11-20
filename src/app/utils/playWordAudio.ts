import type { WordAudioContext, WordItem } from "@/types/games";

type PlayHooks = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
};

let activeAudio: HTMLAudioElement | null = null;
const liveAudios = new Set<HTMLAudioElement>();
let activeUtterance: SpeechSynthesisUtterance | null = null;

function normalizeMediaUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

function wordStem(word: Pick<WordItem, "id" | "text" | "audio" | "audioUrl">): string | null {
  const raw = (word.text || word.id || "").trim().toLowerCase();
  if (!raw) return null;
  // ids may be "tea-2" — prefer text when available
  const fromText = (word.text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+chỉ\s+dành\s+cho\b.*$/u, "")
    .replace(/\s+\d+\s*-\s*\d+\s*yo\b.*$/u, "")
    .trim()
    .replace(/\s+/g, "-");
  if (fromText) return fromText;
  return raw.replace(/-\d+$/, "");
}

function buildCandidateUrls(
  word: Pick<WordItem, "id" | "audio" | "audioUrl" | "text">,
  context?: WordAudioContext,
): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const add = (url?: string | null) => {
    if (!url) return;
    const normalized = normalizeMediaUrl(url);
    if (seen.has(normalized)) return;
    seen.add(normalized);
    urls.push(normalized);
  };

  add(word.audioUrl ?? undefined);
  add(word.audio ?? undefined);

  const stem = wordStem(word);
  if (stem) {
    add(`/assets/vocab/audio/${stem}.mp3`);
  }

  if (context?.bookType && context?.gameSlug) {
    const base = `/audio/wewin/${context.bookType}/${context.gameSlug}/${word.id.toLowerCase()}`;
    add(`${base}.mp3`);
    if (stem) {
      add(`/audio/wewin/${context.bookType}/${context.gameSlug}/${stem}.mp3`);
    }
  }

  return urls;
}

function destroyAudio(audio: HTMLAudioElement) {
  audio.onplay = null;
  audio.onended = null;
  audio.onerror = null;
  audio.muted = true;
  audio.volume = 0;
  try {
    audio.pause();
  } catch {
    // ignore
  }
  try {
    audio.currentTime = 0;
  } catch {
    // ignore
  }
  audio.removeAttribute("src");
  audio.src = "";
  try {
    audio.load();
  } catch {
    // ignore
  }
  liveAudios.delete(audio);
}

function cancelSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
  activeUtterance = null;
}

function speakWithTts(
  text: string,
  hooks?: PlayHooks,
): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis || !text.trim()) {
    return false;
  }

  cancelSpeech();
  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = "en-US";
  utterance.rate = 0.92;
  activeUtterance = utterance;

  utterance.onstart = () => {
    if (activeUtterance !== utterance) return;
    hooks?.onStart?.();
  };
  utterance.onend = () => {
    if (activeUtterance === utterance) activeUtterance = null;
    hooks?.onEnd?.();
  };
  utterance.onerror = () => {
    if (activeUtterance === utterance) activeUtterance = null;
    hooks?.onError?.();
    hooks?.onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopWordAudio(): void {
  cancelSpeech();
  if (activeAudio) {
    destroyAudio(activeAudio);
    activeAudio = null;
  }
  for (const audio of [...liveAudios]) {
    destroyAudio(audio);
  }
}

/**
 * iOS: getUserMedia đổi audio session → HTMLAudio đã phát (kể cả đã ended)
 * tự play lại. Gọi trước VÀ ngay sau khi xin mic.
 */
export function silenceHtmlMediaForMic(): void {
  stopWordAudio();
  if (typeof document === "undefined") return;
  document.querySelectorAll("audio, video").forEach((el) => {
    const media = el as HTMLMediaElement;
    media.muted = true;
    try {
      media.pause();
    } catch {
      // ignore
    }
  });
}

export function playWordAudio(
  word: Pick<WordItem, "id" | "text" | "audio" | "audioUrl">,
  context?: WordAudioContext,
  hooks?: PlayHooks,
): void {
  if (typeof window === "undefined") return;

  const urls = buildCandidateUrls(word, context);
  const spokenText = (word.text || "").trim();

  const finishWithTtsOrError = () => {
    if (spokenText && speakWithTts(spokenText, hooks)) return;
    hooks?.onError?.();
    hooks?.onEnd?.();
  };

  if (!urls.length) {
    finishWithTtsOrError();
    return;
  }

  stopWordAudio();

  const tryAt = (index: number) => {
    if (index >= urls.length) {
      finishWithTtsOrError();
      return;
    }

    const audio = new Audio(urls[index]);
    audio.preload = "auto";
    liveAudios.add(audio);
    activeAudio = audio;

    audio.onplay = () => {
      if (activeAudio !== audio) return;
      hooks?.onStart?.();
    };

    audio.onended = () => {
      destroyAudio(audio);
      if (activeAudio === audio) activeAudio = null;
      hooks?.onEnd?.();
    };

    audio.onerror = () => {
      destroyAudio(audio);
      if (activeAudio === audio) activeAudio = null;
      tryAt(index + 1);
    };

    void audio.play().catch(() => {
      destroyAudio(audio);
      if (activeAudio === audio) activeAudio = null;
      tryAt(index + 1);
    });
  };

  tryAt(0);
}

export function bookTypeFromPathname(pathname: string): string | undefined {
  const segments = pathname.split("/").filter(Boolean);
  const rootIndex = segments.findIndex((s) => s === "games" || s === "resources");
  if (rootIndex < 0 || rootIndex + 1 >= segments.length) return undefined;

  const raw = segments[rootIndex + 1];
  if (raw === "starters") return "starter";
  if (raw === "movers") return "mover";
  if (raw === "flyers") return "flyer";
  if (
    raw === "kids" ||
    raw === "super-kids" ||
    raw === "starter" ||
    raw === "mover" ||
    raw === "flyer"
  ) {
    return raw;
  }
  return undefined;
}
