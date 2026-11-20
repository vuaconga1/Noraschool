import {
  isBgmSuppressed,
  readStoredBgmSettings,
  setBgmSuppressed,
  setSpeechAudioHold,
  stopSharedAudio,
  tryStartBgmPlayback,
} from "@/app/components/audio/bgmEngine";
import {
  closeClickSoundContext,
  setClickSoundsEnabled,
  suspendClickSoundContext,
} from "@/app/components/layouts/clickSound";
import {
  closeGameSfxContext,
  setAmbientGameSfxEnabled,
} from "@/app/utils/gameSfx";
import { stopVoiceSfx } from "@/app/utils/voiceSfx";
import {
  silenceHtmlMediaForMic,
  stopWordAudio,
} from "@/app/utils/playWordAudio";

let resumeBgmAfterSpeech = false;
let micWarmupDone = false;
let pronunciationQuietCount = 0;

/**
 * Trong suốt game phát âm: tắt nhạc nền, tiếng click và hiệu ứng phụ.
 * Giữ audio từ vựng và lời đúng/sai (voice MP3).
 */
export function enterPronunciationQuietMode() {
  pronunciationQuietCount += 1;
  if (pronunciationQuietCount > 1) return;
  setBgmSuppressed(true, "pronunciation");
  stopSharedAudio();
  setClickSoundsEnabled(false);
  setAmbientGameSfxEnabled(false);
}

export function leavePronunciationQuietMode() {
  if (pronunciationQuietCount === 0) return;
  pronunciationQuietCount -= 1;
  if (pronunciationQuietCount > 0) return;
  setClickSoundsEnabled(true);
  setAmbientGameSfxEnabled(true);
  setSpeechAudioHold(false);
  resumeBgmAfterSpeech = false;
  setBgmSuppressed(false, "pronunciation");
  if (isBgmSuppressed()) return;
  const settings = readStoredBgmSettings();
  if (!settings.muted && settings.volume > 0) {
    void tryStartBgmPlayback(settings.trackId);
  }
}

/** Mọi trình duyệt trên iPhone/iPad (Safari + Chrome/Firefox/Edge — đều dùng WebKit). */
export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome/.test(ua);
  return isIosDevice() && isSafari;
}

export function isEmbeddedFrame(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Tạm dừng mọi audio app-level trước khi mở mic (đồng bộ, giữ user gesture).
 * iOS: đóng hẳn Web Audio (không suspend) — suspend hay làm SpeechRecognition aborted.
 */
export function prepareAudioSessionForSpeech() {
  const settings = readStoredBgmSettings();
  resumeBgmAfterSpeech = !settings.muted && settings.volume > 0;
  // iOS: pause() vẫn giữ audio session → SpeechRecognition aborted ngay.
  // Phải unload hẳn HTMLAudioElement (BGM + prompt + SFX).
  setSpeechAudioHold(true);
  stopSharedAudio();
  stopWordAudio();
  stopVoiceSfx();
  silenceHtmlMediaForMic();
  releaseWebAudioForSpeech();
}

/** Chỉ nhả Web Audio — không đụng cờ resume BGM. */
export function releaseWebAudioForSpeech() {
  stopWordAudio();
  stopVoiceSfx();
  if (isIosDevice()) {
    closeClickSoundContext();
    closeGameSfxContext();
  } else {
    suspendClickSoundContext();
  }
}

export type MicPermissionStatus =
  | "granted"
  | "denied"
  | "no-device"
  | "busy"
  | "unsupported";

export type MicPermissionResult = {
  status: MicPermissionStatus;
  errorName?: string;
};

function micErrorName(error: unknown): string {
  if (error && typeof error === "object" && "name" in error) {
    return String((error as { name?: string }).name || "Error");
  }
  return "Error";
}

function classifyMicError(error: unknown): MicPermissionStatus {
  const name = micErrorName(error);
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "no-device";
  }
  if (name === "NotReadableError" || name === "AbortError" || name === "TrackStartError") {
    return "busy";
  }
  if (
    name === "NotAllowedError" ||
    name === "PermissionDeniedError" ||
    name === "SecurityError"
  ) {
    return "denied";
  }
  // OverconstrainedError và lỗi khác: coi như denied/retry ở tầng gọi.
  return "denied";
}

/**
 * Xin quyền micro rồi giải phóng ngay — KHÔNG giữ MediaStream.
 * Giữ stream sống sẽ xung đột với webkitSpeechRecognition trên iOS Safari.
 * Desktop cũng cần gọi trước SpeechRecognition — API nhận dạng giọng thường
 * không tự hiện hộp thoại micro (chỉ trả not-allowed).
 */
export async function warmupMicPermission(): Promise<MicPermissionResult> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { status: "unsupported", errorName: "MissingMediaDevices" };
  }

  const attempts: MediaStreamConstraints[] = [
    // Constraint đơn giản nhất — tương thích Edge/Windows tốt hơn.
    { audio: true },
    {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    },
  ];

  let lastError: unknown = null;
  for (const constraints of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((track) => track.stop());
      micWarmupDone = true;
      return { status: "granted" };
    } catch (error) {
      lastError = error;
      const name = micErrorName(error);
      // Constraint quá chặt → thử constraint kế tiếp.
      if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
        continue;
      }
      return { status: classifyMicError(error), errorName: name };
    }
  }

  return {
    status: classifyMicError(lastError),
    errorName: micErrorName(lastError),
  };
}

export function hasWarmedUpMic(): boolean {
  return micWarmupDone;
}

/** @deprecated Dùng warmupMicPermission — không giữ stream khi nhận diện giọng nói. */
export async function acquireMicStream(): Promise<
  | { status: "granted"; stream: MediaStream }
  | { status: "denied" }
  | { status: "unsupported" }
> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { status: "unsupported" };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return { status: "granted", stream };
  } catch {
    return { status: "denied" };
  }
}

export function releaseMicStream(stream: MediaStream | null | undefined) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

export function restoreAudioSessionAfterSpeech() {
  setSpeechAudioHold(false);
  if (pronunciationQuietCount > 0) {
    resumeBgmAfterSpeech = false;
    return;
  }
  if (!resumeBgmAfterSpeech) return;
  resumeBgmAfterSpeech = false;
  const settings = readStoredBgmSettings();
  if (!settings.muted && settings.volume > 0) {
    void tryStartBgmPlayback(settings.trackId);
  }
}

export function suspendAudioContext(ctx: AudioContext | null | undefined) {
  if (!ctx || ctx.state !== "running") return;
  void ctx.suspend();
}

export function resumeAudioContext(ctx: AudioContext | null | undefined) {
  if (!ctx || ctx.state !== "suspended") return;
  void ctx.resume();
}
