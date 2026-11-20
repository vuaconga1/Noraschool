import { getVoiceVolumeMultiplier } from "@/app/components/audio/voiceSettings";

export type VoiceSfxType = "correct" | "wrong";

export type VoiceSfxOption = {
  phrase: string;
  src: string;
};

const VOICE_OPTIONS: Record<VoiceSfxType, readonly VoiceSfxOption[]> = {
  correct: [
    { phrase: "Wonderful!", src: "/audio/voice/wonderful.mp3" },
    { phrase: "You got it!", src: "/audio/voice/you-got-it.mp3" },
    { phrase: "Fantastic!", src: "/audio/voice/fantastic.mp3" },
    { phrase: "Super!", src: "/audio/voice/super.mp3" },
    { phrase: "Perfect!", src: "/audio/voice/perfect.mp3" },
    { phrase: "Awesome!", src: "/audio/voice/awesome.mp3" },
    { phrase: "Well done!", src: "/audio/voice/well-done.mp3" },
    { phrase: "Great!", src: "/audio/voice/great.mp3" },
    { phrase: "Excellent!", src: "/audio/voice/excellent.mp3" },
  ],
  wrong: [
    { phrase: "One more try!", src: "/audio/voice/one-more-try.mp3" },
    { phrase: "Try again!", src: "/audio/voice/try-again.mp3" },
    { phrase: "Keep practicing!", src: "/audio/voice/keep-practicing.mp3" },
    { phrase: "So close!", src: "/audio/voice/so-close.mp3" },
    { phrase: "Don't give up!", src: "/audio/voice/dont-give-up.mp3" },
    { phrase: "Almost!", src: "/audio/voice/almost.mp3" },
  ],
};

let activeVoice: HTMLAudioElement | null = null;
let activeResolve: (() => void) | null = null;
let lastPlayedSrc: string | null = null;

export function pickVoiceSfx(
  type: VoiceSfxType,
  excludedSrc: string | null = lastPlayedSrc,
): VoiceSfxOption {
  const pool = VOICE_OPTIONS[type];
  const candidates = excludedSrc
    ? pool.filter((option) => option.src !== excludedSrc)
    : pool;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
}

function settleActiveVoice() {
  const resolve = activeResolve;
  activeResolve = null;
  resolve?.();
}

export function stopVoiceSfx() {
  if (!activeVoice) {
    settleActiveVoice();
    return;
  }
  const audio = activeVoice;
  activeVoice = null;
  audio.onended = null;
  audio.onerror = null;
  audio.muted = true;
  audio.volume = 0;
  audio.pause();
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
  settleActiveVoice();
}

/**
 * Phát ngẫu nhiên lời động viên tiếng Anh cho câu trả lời đúng hoặc sai.
 * Resolve khi clip kết thúc (hoặc lỗi / bị dừng).
 */
export function playVoiceSfx(
  type: VoiceSfxType,
  selected?: VoiceSfxOption,
): Promise<void> {
  const volume = getVoiceVolumeMultiplier();
  if (volume <= 0 || typeof window === "undefined") {
    return Promise.resolve();
  }

  stopVoiceSfx();

  return new Promise((resolve) => {
    const option = selected ?? pickVoiceSfx(type);
    const audio = new Audio(option.src);
    audio.volume = volume;
    activeVoice = audio;
    activeResolve = resolve;
    lastPlayedSrc = option.src;

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      audio.onended = null;
      audio.onerror = null;
      if (activeVoice === audio) activeVoice = null;
      if (activeResolve === resolve) activeResolve = null;
      resolve();
    };

    audio.onended = finish;
    audio.onerror = finish;
    void audio.play().then(undefined, finish);
  });
}
