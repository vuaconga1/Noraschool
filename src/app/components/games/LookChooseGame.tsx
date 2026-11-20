"use client";

import { useMemo, useState } from "react";
import type { WordItem } from "@/types/games";
import { buildLookChooseQuestions } from "@/lib/games/choiceBuilders";
import {
  SeasonGamePanel,
  useGameSeasonTheme,
} from "@/app/components/games/forest-background";
import { GameSummaryModal } from "@/app/components/games/GameSummaryModal";
import { playGameSfx } from "@/app/utils/gameSfx";

type Props = {
  title: string;
  words: WordItem[];
  onComplete?: (score: number, maxScore: number, itemCount: number) => void;
  onChooseOtherGame?: () => void;
};

const SUCCESS = ["Great!", "Awesome!", "Super!", "Fantastic!", "Well done!"];

export function LookChooseGame({
  title,
  words,
  onComplete,
  onChooseOtherGame,
}: Props) {
  const { ui } = useGameSeasonTheme("look");
  const questions = useMemo(() => buildLookChooseQuestions(words), [words]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState("");
  const [done, setDone] = useState(false);

  const question = questions[index];
  const maxScore = questions.length * 100;

  const finish = (finalScore: number) => {
    setDone(true);
    onComplete?.(finalScore, maxScore, questions.length);
    playGameSfx("gameComplete");
  };

  const answer = (text: string) => {
    if (!question || locked || done) return;
    setLocked(true);
    const isOk = text === question.correct;
    const nextScore = score + (isOk ? 100 : 0);
    const nextCorrect = correctCount + (isOk ? 1 : 0);
    setSelected(text);
    setOk(isOk);
    if (isOk) {
      setFeedback(SUCCESS[nextCorrect % SUCCESS.length]);
    }

    void playGameSfx(isOk ? "correct" : "wrong").then(() => {
      setFeedback("");
      setSelected(null);
      setOk(null);
      setLocked(false);
      setScore(nextScore);
      setCorrectCount(nextCorrect);
      if (index >= questions.length - 1) finish(nextScore);
      else setIndex((i) => i + 1);
    });
  };

  if (!questions.length) {
    return (
      <SeasonGamePanel game="look" maxWidth="5xl" className="compact-fit" showMascot={false}>
        <p className={`py-10 text-center font-bold ${ui.heading}`}>
          Cần ít nhất 2 từ có hình để chơi Look &amp; Choose.
        </p>
      </SeasonGamePanel>
    );
  }

  return (
    <SeasonGamePanel
      game="look"
      maxWidth="5xl"
      className="compact-fit relative"
      showMascot={false}
    >
      <div className="flex flex-col gap-2 md:gap-3">
        <header className="shrink-0 text-center">
          <h2 className={`text-lg font-semibold sm:text-xl ${ui.heading}`}>
            {title}
          </h2>
          <p className={`text-sm ${ui.subtext}`}>
            Nhìn hình và chọn từ tiếng Anh đúng
          </p>
        </header>

        <div
          className={`flex shrink-0 items-center justify-around gap-2 rounded-xl px-2 py-1.5 shadow-sm divide-x ${ui.statBg} ${ui.statDivider}`}
        >
          <div className="flex flex-1 items-center justify-center gap-1">
            <span className={`text-xs ${ui.label}`}>⭐</span>
            <span className={`text-base font-bold sm:text-lg ${ui.heading}`}>
              {score}
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center gap-1">
            <span className={`text-xs ${ui.label}`}>📚</span>
            <span className={`text-base font-bold sm:text-lg ${ui.heading}`}>
              {Math.min(index + 1, questions.length)}/{questions.length}
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center gap-1">
            <span className={`text-xs ${ui.label}`}>✅</span>
            <span className={`text-base font-bold sm:text-lg ${ui.heading}`}>
              {correctCount}
            </span>
          </div>
        </div>

        {question && !done && (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.image}
              alt={question.correct}
              className={`h-[22vh] max-h-44 min-h-[7rem] w-auto rounded-2xl border-4 bg-white/80 object-contain p-1.5 shadow-lg sm:max-h-52 ${ui.cardRevealed}`}
            />
            <div className="grid w-full max-w-2xl grid-cols-2 gap-2 sm:gap-3">
              {question.options.map((text) => {
                let ring = `${ui.tile} hover:opacity-95`;
                if (selected) {
                  if (ok && text === question.correct) {
                    ring =
                      "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200 scale-[1.02]";
                  } else if (!ok && text === selected) {
                    ring = "animate-pulse border-red-500 bg-red-50";
                  }
                }
                return (
                  <button
                    key={text}
                    type="button"
                    disabled={locked}
                    onClick={() => answer(text)}
                    className={`min-h-[3rem] rounded-2xl border-4 px-3 py-2.5 text-base font-black shadow-md transition active:scale-95 sm:min-h-[3.5rem] sm:text-lg ${ring}`}
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {feedback ? (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
          <div className="rounded-full bg-white/95 px-5 py-2 text-base font-black text-emerald-600 shadow-xl">
            ✨ {feedback} ✨
          </div>
        </div>
      ) : null}

      <GameSummaryModal
        open={done}
        score={score}
        correctCount={correctCount}
        wrongCount={questions.length - correctCount}
        totalCount={questions.length}
        game="look"
        onPlayAgain={() => {
          setIndex(0);
          setScore(0);
          setCorrectCount(0);
          setDone(false);
        }}
        onChooseOtherGame={onChooseOtherGame}
      />
    </SeasonGamePanel>
  );
}
