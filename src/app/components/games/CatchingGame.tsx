"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { WordAudioContext, WordItem } from "@/types/games";
import { buildCatchWords } from "@/lib/games/choiceBuilders";
import { playWordAudio } from "@/app/utils/playWordAudio";
import {
  SeasonGamePanel,
  useGameSeasonTheme,
} from "@/app/components/games/forest-background";
import { GameSummaryModal } from "@/app/components/games/GameSummaryModal";
import { playGameSfx } from "@/app/utils/gameSfx";

type Props = {
  title: string;
  words: WordItem[];
  audioContext?: WordAudioContext;
  onComplete?: (score: number, maxScore: number, itemCount: number) => void;
  onChooseOtherGame?: () => void;
};

type FallingItem = {
  element: HTMLDivElement;
  x: number;
  y: number;
  size: number;
  speed: number;
  en: string;
  audio: string;
  word?: WordItem;
  /** Đang bay vào rổ — bỏ qua physics */
  catching?: boolean;
};

const FRAME_MS = 1000 / 30;
const DURATION = 60;
const CATCH_ANIM_MS = 420;

export function CatchingGame({
  title,
  words,
  audioContext,
  onComplete,
  onChooseOtherGame,
}: Props) {
  const { ui } = useGameSeasonTheme("catch");
  const catchWords = useMemo(() => buildCatchWords(words), [words]);
  const areaRef = useRef<HTMLDivElement>(null);
  const basketRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<FallingItem[]>([]);
  const metricsRef = useRef({
    areaLeft: 0,
    areaWidth: 0,
    areaHeight: 0,
    basketHalf: 0,
    basketX: 0,
    basketLeft: 0,
    basketRight: 0,
    basketTop: 0,
    basketBottom: 0,
    groundLimit: 0,
    lastFrame: 0,
    pendingX: null as number | null,
    pointerRaf: 0,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef = useRef(0);
  const scoreRef = useRef(0);
  const catchRef = useRef(0);
  const remainRef = useRef(DURATION);

  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(DURATION);
  const [bounce, setBounce] = useState(false);
  const [done, setDone] = useState(false);
  const [caught, setCaught] = useState(0);

  const refreshMetrics = useCallback(() => {
    const area = areaRef.current;
    const basket = basketRef.current;
    const m = metricsRef.current;
    if (!area || !basket) return;
    const rect = area.getBoundingClientRect();
    m.areaLeft = rect.left;
    m.areaWidth = area.clientWidth;
    m.areaHeight = area.clientHeight;
    m.basketHalf = basket.offsetWidth / 2;
    m.groundLimit = m.areaHeight * 0.88;
    m.basketTop = m.groundLimit - basket.offsetHeight;
    m.basketBottom = m.basketTop + basket.offsetHeight;
    m.basketX = Math.max(
      m.basketHalf,
      Math.min(m.areaWidth - m.basketHalf, m.basketX || m.areaWidth / 2),
    );
    m.basketLeft = m.basketX - m.basketHalf;
    m.basketRight = m.basketX + m.basketHalf;
    basket.style.transform = `translate3d(${m.basketLeft}px, 0, 0)`;
  }, []);

  const stopLoop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (spawnRef.current) clearTimeout(spawnRef.current);
    cancelAnimationFrame(animRef.current);
    if (metricsRef.current.pointerRaf) {
      cancelAnimationFrame(metricsRef.current.pointerRaf);
    }
    itemsRef.current.forEach((item) => item.element.remove());
    itemsRef.current = [];
  }, []);

  useEffect(() => {
    if (!catchWords.length) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      catchWords.map(
        (q) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = q.image;
          }),
      ),
    ).finally(() => setLoading(false));
    return () => stopLoop();
  }, [catchWords, stopLoop]);

  useEffect(() => {
    if (!started) return;
    refreshMetrics();
    const onResize = () => refreshMetrics();
    window.addEventListener("resize", onResize);

    const tick = () => {
      remainRef.current -= 1;
      setTimer(remainRef.current);
      if (remainRef.current <= 0) {
        stopLoop();
        setDone(true);
        const maxScore = Math.max(catchRef.current * 10, 10);
        onComplete?.(scoreRef.current, maxScore, catchRef.current);
        playGameSfx("gameComplete");
      } else {
        timerRef.current = setTimeout(tick, 1000);
      }
    };
    timerRef.current = setTimeout(tick, 1000);

    const spawn = () => {
      if (remainRef.current <= 0) return;
      const area = areaRef.current;
      if (!area || !catchWords.length) return;
      const q = catchWords[Math.floor(Math.random() * catchWords.length)];
      const size =
        window.innerWidth < 480 ? 60 : window.innerWidth < 768 ? 80 : 100;
      const m = metricsRef.current;
      const width = m.areaWidth || area.clientWidth;
      const x = Math.max(8, Math.min(width - size - 8, Math.random() * width));
      const el = document.createElement("div");
      el.className = "absolute pointer-events-none";
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.left = `${x}px`;
      el.style.top = "0px";
      el.style.transform = `translate3d(0, ${-size}px, 0)`;
      el.innerHTML = `<img src="${q.image}" alt="" class="h-full w-full rounded-xl object-contain bg-white/80 shadow" />`;
      area.appendChild(el);
      const base = window.innerHeight < 700 ? 1.6 : 2.2;
      const word = words.find((w) => w.text.trim() === q.en);
      itemsRef.current.push({
        element: el,
        x,
        y: -size,
        size,
        speed: base + Math.random() * 1.4,
        en: q.en,
        audio: q.audio,
        word,
      });
      spawnRef.current = setTimeout(spawn, 1400 + Math.random() * 1800);
    };
    spawn();

    const loop = (ts = 0) => {
      const m = metricsRef.current;
      if (!m.areaWidth) refreshMetrics();
      const delta = m.lastFrame ? ts - m.lastFrame : FRAME_MS;
      if (delta < FRAME_MS) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }
      const scale = Math.min(delta, 50) / FRAME_MS;
      m.lastFrame = ts;

      for (let i = itemsRef.current.length - 1; i >= 0; i -= 1) {
        const item = itemsRef.current[i];
        if (item.catching) continue;

        item.y += item.speed * scale;
        item.element.style.transform = `translate3d(0, ${item.y}px, 0)`;
        const cx = item.x + item.size / 2;
        const cy = item.y + item.size / 2;
        const touching = item.y + item.size >= m.basketTop + 10;
        const above = cy < m.basketBottom;
        const inside = cx > m.basketLeft && cx < m.basketRight;
        if (touching && above && inside) {
          catchRef.current += 1;
          scoreRef.current += 10;
          setScore(scoreRef.current);
          setCaught(catchRef.current);
          setBounce(true);
          window.setTimeout(() => setBounce(false), 280);

          // +10 nổi ngay trên miệng rổ rồi biến mất
          const area = areaRef.current;
          if (area) {
            const pop = document.createElement("div");
            pop.className = "catch-plus-ten";
            pop.textContent = "+10";
            pop.style.left = `${m.basketX}px`;
            pop.style.top = `${Math.max(8, m.basketTop - 4)}px`;
            area.appendChild(pop);
            window.setTimeout(() => pop.remove(), 780);
          }

          // Ting xong mới phát audio từ vựng — không phát lời động viên đúng/sai.
          const caughtWord = item.word;
          const caughtAudio = item.audio;
          void playGameSfx("ting").then(() => {
            if (caughtWord) playWordAudio(caughtWord, audioContext);
            else if (caughtAudio) {
              const a = new Audio(caughtAudio);
              void a.play().catch(() => undefined);
            }
          });

          item.catching = true;
          const basketCx = m.basketX;
          const basketCy = m.basketTop + (m.basketBottom - m.basketTop) * 0.4;
          const dx = basketCx - (item.x + item.size / 2);
          const targetY = basketCy - item.size / 2;
          const el = item.element;
          el.style.zIndex = "60";
          el.style.transition =
            "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.42s ease";
          // Force reflow so transition runs from current position.
          void el.offsetWidth;
          el.style.transform = `translate3d(${dx}px, ${targetY}px, 0) scale(0.18)`;
          el.style.opacity = "0.35";
          window.setTimeout(() => {
            el.remove();
            const idx = itemsRef.current.indexOf(item);
            if (idx >= 0) itemsRef.current.splice(idx, 1);
          }, CATCH_ANIM_MS);
          continue;
        }
        if (item.y > m.groundLimit) {
          item.element.style.transition = "opacity 0.25s";
          item.element.style.opacity = "0";
          window.setTimeout(() => item.element.remove(), 250);
          itemsRef.current.splice(i, 1);
        }
      }
      if (remainRef.current > 0) animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", onResize);
      stopLoop();
    };
  }, [
    started,
    catchWords,
    words,
    audioContext,
    onComplete,
    refreshMetrics,
    stopLoop,
  ]);

  const onPointerMove = (e: React.PointerEvent) => {
    const m = metricsRef.current;
    if (!m.areaWidth) refreshMetrics();
    m.pendingX = e.clientX - m.areaLeft;
    if (m.pointerRaf) return;
    m.pointerRaf = requestAnimationFrame(() => {
      m.pointerRaf = 0;
      if (m.pendingX === null) return;
      m.basketX = m.pendingX;
      m.pendingX = null;
      m.basketLeft = m.basketX - m.basketHalf;
      m.basketRight = m.basketX + m.basketHalf;
      if (basketRef.current) {
        basketRef.current.style.transform = `translate3d(${m.basketLeft}px, 0, 0)`;
      }
    });
  };

  const startGame = () => {
    catchRef.current = 0;
    scoreRef.current = 0;
    remainRef.current = DURATION;
    setScore(0);
    setCaught(0);
    setTimer(DURATION);
    setDone(false);
    setStarted(true);
    metricsRef.current.basketX = areaRef.current
      ? areaRef.current.clientWidth / 2
      : 0;
    refreshMetrics();
  };

  if (!catchWords.length) {
    return (
      <SeasonGamePanel game="catch" maxWidth="5xl" className="compact-fit" showMascot={false}>
        <p className={`py-10 text-center font-bold ${ui.heading}`}>
          Cần từ vựng có hình để chơi Catching.
        </p>
      </SeasonGamePanel>
    );
  }

  return (
    <SeasonGamePanel
      game="catch"
      maxWidth="5xl"
      className="compact-fit"
      showMascot={false}
    >
      <header className="text-center">
        <h2 className={`text-lg font-semibold sm:text-xl ${ui.heading}`}>
          {title}
        </h2>
        <p className={`text-sm ${ui.subtext}`}>
          Di chuyển giỏ để hứng từ vựng trong 60 giây!
        </p>
      </header>

      <div
        className={`mt-2 grid grid-cols-2 gap-2 ${ui.statBg} rounded-xl p-1.5 shadow-sm`}
      >
        <div className="flex flex-col items-center py-2">
          <span className="text-xl">⭐</span>
          <span className={`text-2xl font-black tabular-nums ${ui.heading}`}>
            {score}
          </span>
          <span className={`text-xs font-bold uppercase ${ui.label}`}>Điểm</span>
        </div>
        <div className="flex flex-col items-center py-2">
          <span className="text-xl">⏱️</span>
          <span
            className={`text-2xl font-black tabular-nums ${
              timer <= 10 ? "text-red-600" : ui.heading
            }`}
          >
            {timer}s
          </span>
          <span className={`text-xs font-bold uppercase ${ui.label}`}>
            Thời gian
          </span>
        </div>
      </div>

      {loading ? (
        <p className={`py-16 text-center font-bold ${ui.subtext}`}>
          Đang chuẩn bị màn chơi...
        </p>
      ) : (
        <div
          ref={areaRef}
          className={`relative mt-2 h-[48vh] max-h-[420px] min-h-[220px] w-full touch-none overflow-hidden rounded-2xl border-2 shadow-inner ${ui.panelBorder}`}
          style={{
            background:
              "linear-gradient(180deg, #99f6e4 0%, #5eead4 40%, #2dd4bf 100%)",
            cursor: "crosshair",
          }}
          onPointerMove={onPointerMove}
        >
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%]"
            style={{
              background:
                "linear-gradient(180deg, rgba(13,148,136,0.15), #0f766e)",
            }}
          />
          {!started && (
            <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-white/25 backdrop-blur-[1px]">
              <div className="animate-bounce text-5xl">🧺</div>
              <button
                type="button"
                onClick={startGame}
                className={`rounded-full px-8 py-3 text-lg font-black text-white shadow-xl ${ui.primaryBtn}`}
              >
                ▶ BẮT ĐẦU
              </button>
              <p className="text-sm font-semibold text-slate-600">
                Di chuột / kéo tay để hứng từ!
              </p>
            </div>
          )}
          <div
            ref={basketRef}
            className="absolute bottom-[12%] left-0 z-50 flex h-20 w-20 select-none items-center justify-center sm:h-28 sm:w-28"
            style={{ pointerEvents: "none", willChange: "transform" }}
          >
            {/* Scale riêng trên emoji — tránh conflict với translate3d của rổ */}
            <span
              className={`text-5xl leading-none sm:text-7xl ${
                bounce ? "scale-125" : "scale-100"
              }`}
              style={{
                display: "inline-block",
                transition: "transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              🧺
            </span>
          </div>
        </div>
      )}

      <GameSummaryModal
        open={done}
        score={score}
        correctCount={caught}
        wrongCount={0}
        totalCount={Math.max(caught, 1)}
        game="catch"
        onPlayAgain={() => {
          stopLoop();
          setStarted(false);
          setDone(false);
          setScore(0);
          setCaught(0);
          setTimer(DURATION);
        }}
        onChooseOtherGame={() => {
          stopLoop();
          onChooseOtherGame?.();
        }}
      />
    </SeasonGamePanel>
  );
}
