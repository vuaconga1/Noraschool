import {
  BGM_DEFAULT_SETTINGS,
  BGM_STORAGE_KEY,
  getBgmTrack,
  isBgmTrackId,
  type BgmSettings,
  type BgmTrackId,
} from "./constants";

let sharedAudio: HTMLAudioElement | null = null;
let sharedTrackSrc: string | null = null;
let autoplayBound = false;
let speechHoldActive = false;
let bgmSuppressed = false;
/** Independent holds (route vs pronunciation) must not clear each other. */
const bgmSuppressReasons = new Set<string>();
const loopBound = new WeakSet<HTMLAudioElement>();

/** Đảm bảo nhạc nền lặp lại khi hết bài (loop + fallback ended). */
function ensureBgmLoop(audio: HTMLAudioElement) {
  audio.loop = true;

  if (loopBound.has(audio)) return;
  loopBound.add(audio);

  const markLoopReady = () => {
    audio.loop = true;
  };
  audio.addEventListener("loadedmetadata", markLoopReady);
  audio.addEventListener("canplaythrough", markLoopReady);

  audio.addEventListener("ended", () => {
    if (speechHoldActive || bgmSuppressed || audio.muted) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  });
}

function createSharedAudio(src: string) {
  stopSharedAudio();
  sharedAudio = new Audio(src);
  sharedAudio.preload = "auto";
  ensureBgmLoop(sharedAudio);
  sharedTrackSrc = src;
  return sharedAudio;
}

export function getSharedAudio(src: string) {
  if (typeof window === "undefined") return null;

  if (sharedAudio && sharedTrackSrc === src) {
    ensureBgmLoop(sharedAudio);
    return sharedAudio;
  }

  return createSharedAudio(src);
}

export function pauseSharedAudio() {
  sharedAudio?.pause();
}

/** Chặn BGM tự phát khi đang giữ audio session cho SpeechRecognition (iOS). */
export function setSpeechAudioHold(active: boolean) {
  speechHoldActive = active;
  if (active) {
    stopSharedAudio();
  }
}

export function isSpeechAudioHoldActive() {
  return speechHoldActive;
}

/** Chặn BGM tạm thời. Mỗi `reason` là một hold riêng, không xóa hold khác. */
export function setBgmSuppressed(suppressed: boolean, reason = "default") {
  if (suppressed) bgmSuppressReasons.add(reason);
  else bgmSuppressReasons.delete(reason);
  bgmSuppressed = bgmSuppressReasons.size > 0;
  if (bgmSuppressed) {
    pauseSharedAudio();
  }
}

export function isBgmSuppressed(): boolean {
  return bgmSuppressed;
}

function unloadElement(audio: HTMLAudioElement) {
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch {
    // ignore
  }
  audio.removeAttribute("src");
  audio.load();
}

/** Dừng hẳn — chỉ khi đổi bài hoặc reset player. */
export function stopSharedAudio() {
  if (!sharedAudio) return;
  unloadElement(sharedAudio);
  sharedAudio = null;
  sharedTrackSrc = null;
}

export function readStoredBgmSettings(): BgmSettings {
  if (typeof window === "undefined") return BGM_DEFAULT_SETTINGS;

  try {
    const raw = localStorage.getItem(BGM_STORAGE_KEY);
    if (!raw) return BGM_DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<BgmSettings>;
    const volume =
      typeof parsed.volume === "number"
        ? Math.min(1, Math.max(0, parsed.volume))
        : BGM_DEFAULT_SETTINGS.volume;
    const muted =
      typeof parsed.muted === "boolean"
        ? parsed.muted
        : BGM_DEFAULT_SETTINGS.muted;
    const trackId = isBgmTrackId(parsed.trackId)
      ? parsed.trackId
      : BGM_DEFAULT_SETTINGS.trackId;
    return { volume, muted, trackId };
  } catch {
    return BGM_DEFAULT_SETTINGS;
  }
}

export function writeStoredBgmSettings(settings: BgmSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BGM_STORAGE_KEY, JSON.stringify(settings));
}

export function applyBgmSettings(next: BgmSettings) {
  if (speechHoldActive || bgmSuppressed) return;
  const track = getBgmTrack(next.trackId);
  const audio = getSharedAudio(track.src);
  if (!audio) return;
  audio.volume = next.volume;
  audio.muted = next.muted;
}

function bindAutoplayUnlock(onPlay: () => void) {
  if (autoplayBound) return;
  autoplayBound = true;

  const tryPlay = () => {
    const audio = sharedAudio;
    if (!audio || audio.muted) return;
    void audio.play().then(onPlay).catch(() => {});
  };

  const unlock = () => {
    if (speechHoldActive || bgmSuppressed) {
      autoplayBound = false;
      return;
    }
    tryPlay();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };

  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

export async function tryStartBgmPlayback(
  trackId: BgmTrackId,
): Promise<"playing" | "blocked" | "muted"> {
  if (speechHoldActive || bgmSuppressed) return "muted";

  const track = getBgmTrack(trackId);
  const audio = getSharedAudio(track.src);
  if (!audio || audio.muted) return "muted";

  try {
    await audio.play();
    if (speechHoldActive || bgmSuppressed) {
      if (sharedAudio === audio) stopSharedAudio();
      else unloadElement(audio);
      return "muted";
    }
    return "playing";
  } catch {
    bindAutoplayUnlock(() => {});
    return "blocked";
  }
}

export function resetAutoplayBinding() {
  autoplayBound = false;
}
