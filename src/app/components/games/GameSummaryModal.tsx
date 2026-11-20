"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  useGameSeasonTheme,
  type SeasonGameType,
} from "@/app/components/games/forest-background";
import { playGameSfx } from "@/app/utils/gameSfx";

type GameSummaryModalProps = {
  open: boolean;
  score: number;
  correctCount: number;
  wrongCount: number;
  totalCount: number;
  game: SeasonGameType;
  onPlayAgain: () => void;
  onChooseOtherGame?: () => void;
};

export function GameSummaryModal({
  open,
  score,
  correctCount,
  wrongCount,
  totalCount,
  game,
  onPlayAgain,
  onChooseOtherGame,
}: GameSummaryModalProps) {
  const { ui } = useGameSeasonTheme(game);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    playGameSfx("popupOpen");
    const fanfare = window.setTimeout(() => playGameSfx("gameComplete"), 120);
    return () => window.clearTimeout(fanfare);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  const primaryBtn =
    ui.primaryBtn ||
    "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_10px_20px_rgba(59,130,246,0.3)] hover:shadow-xl hover:shadow-blue-500/20";
  const secondaryBtn =
    ui.secondaryBtn ||
    "border-4 border-blue-100 bg-white text-blue-600 hover:border-blue-300 hover:bg-blue-50";

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-900/45 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-summary-title"
    >
      <section
        className={`relative my-auto w-full max-w-2xl max-h-[min(92dvh,920px)] overflow-y-auto rounded-[28px] border p-5 text-center shadow-2xl sm:rounded-[40px] sm:p-8 ${ui.panel} ${ui.panelBorder}`}
      >
        <h2
          id="game-summary-title"
          className={`mb-2 text-2xl font-black uppercase sm:mb-3 sm:text-4xl md:text-5xl ${ui.heading}`}
        >
          Chúc mừng bé!
        </h2>
        <p className={`mb-5 text-base font-bold sm:mb-6 sm:text-xl ${ui.subtext}`}>
          Bé đã hoàn thành xuất sắc trò chơi 🏆
        </p>

        <div
          className={`mx-auto mb-5 max-w-sm rounded-3xl border-4 p-4 shadow-inner sm:mb-6 sm:p-6 ${ui.statBg} ${ui.panelBorder}`}
        >
          <div
            className={`mb-1 text-4xl font-black drop-shadow-md sm:mb-2 sm:text-6xl md:text-7xl ${ui.heading}`}
          >
            {score}
          </div>
          <div
            className={`text-sm font-bold uppercase tracking-wide sm:text-base ${ui.label}`}
          >
            Điểm Khám Phá
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-3 sm:gap-4">
          <div
            className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 font-bold shadow-sm sm:px-6 sm:text-lg ${ui.statusSuccess}`}
          >
            <span className="text-xl">✅</span>
            <span>{correctCount}</span>
            <span>Đúng</span>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 font-bold text-rose-700 shadow-sm sm:px-6 sm:text-lg">
            <span className="text-xl">❌</span>
            <span>{wrongCount}</span>
            <span>Sai</span>
          </div>
          <div
            className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 font-bold shadow-sm sm:px-6 sm:text-lg ${ui.statusInfo}`}
          >
            <span className="text-xl">🎯</span>
            <span>{totalCount}</span>
            <span>Câu</span>
          </div>
        </div>

        <div
          className={`grid gap-3 sm:gap-4 ${onChooseOtherGame ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
        >
          <button
            type="button"
            onClick={onPlayAgain}
            className={`flex items-center justify-center gap-2 rounded-[24px] px-6 py-3.5 text-lg font-black transition-all hover:-translate-y-1 active:scale-95 sm:py-4 sm:text-xl ${primaryBtn}`}
          >
            🔄 Chơi lại nhé
          </button>

          {onChooseOtherGame && (
            <button
              type="button"
              onClick={onChooseOtherGame}
              className={`flex items-center justify-center gap-2 rounded-[24px] px-6 py-3.5 text-lg font-black shadow-lg transition-all active:scale-95 sm:py-4 sm:text-xl ${secondaryBtn}`}
            >
              🎮 Chọn Game Khác
            </button>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
