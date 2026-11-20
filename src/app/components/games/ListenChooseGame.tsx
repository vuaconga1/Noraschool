"use client";

import { useEffect, useMemo, useState } from "react";
import type { WordAudioContext, WordItem } from "@/types/games";
import { buildListenChooseQuestions } from "@/lib/games/choiceBuilders";
import { playWordAudio, stopWordAudio } from "@/app/utils/playWordAudio";
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

const SUCCESS = ["Great!", "Awesome!", "Super!", "Fantastic!", "Well done!"];

export function ListenChooseGame({
  title,
  words,
  audioContext,
  onComplete,
  onChooseOtherGame,
}: Props) {
  const { ui } = useGameSeasonTheme("listen");
  const questions = useMemo(() => buildListenChooseQuestions(words), [words]);
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

  useEffect(() => {
    if (!question) return;
    const word = words.find((w) => w.text === question.text);
    if (word) void playWordAudio(word, audioContext);
    else if (question.audio) {
      const audio = new Audio(question.audio);
      void audio.play().catch(() => undefined);
    }
  }, [index, question, words, audioContext]);

  const finish = (finalScore: number) => {
    setDone(true);
    onComplete?.(finalScore, maxScore, questions.length);
    playGameSfx("gameComplete");
  };

  const answer = (imgUrl: string) => {
    if (!question || locked || done) return;
    setLocked(true);
    const isOk = imgUrl === question.correct;
    const nextScore = score + (isOk ? 100 : 0);
    const nextCorrect = correctCount + (isOk ? 1 : 0);
    setSelected(imgUrl);
    setOk(isOk);
    if (isOk) {
      setFeedback(SUCCESS[nextCorrect % SUCCESS.length]);
    }

    stopWordAudio();
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

  const replay = () => {
    const word = words.find((w) => w.text === question?.text);
    if (word) void playWordAudio(word, audioContext);
    else if (question?.audio) {
      const audio = new Audio(question.audio);
      void audio.play().catch(() => undefined);
    }
  };

  if (!questions.length) {
    return (
      <SeasonGamePanel game="listen" maxWidth="5xl" className="compact-fit" showMascot={false}>
        <p className={`py-10 text-center font-bold ${ui.heading}`}>
          Cần ít nhất 2 từ có hình để chơi Listen &amp; Choose.
        </p>
      </SeasonGamePanel>
    );
  }

  return (
    <SeasonGamePanel
      game="listen"
      maxWidth="5xl"
      className="compact-fit relative"
      showMascot={false}
    >
      <div className="flex flex-col gap-2 md:gap-3">
        <header className="shrink-0 text-center">
          <h2 className={`text-lg font-semibold sm:text-xl ${ui.heading}`}>
            {title}
          </h2>
          <p className={`text-sm ${ui.subtext}`}>Nghe từ và chọn hình đúng</p>
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
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={replay}
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl text-white shadow-lg transition active:scale-90 sm:h-16 sm:w-16 sm:text-3xl ${ui.primaryBtn}`}
              aria-label="Nghe lại"
            >
              🔊
            </button>
            <div className="grid w-full max-w-2xl grid-cols-2 gap-2 sm:gap-3">
              {question.options.map((imgUrl, i) => {
                let ring = `${ui.cardRevealed} hover:-translate-y-0.5`;
                if (selected) {
                  if (ok && imgUrl === question.correct) {
                    ring =
                      "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200 scale-[1.02]";
                  } else if (!ok && imgUrl === selected) {
                    ring = "animate-pulse border-red-500 bg-red-50";
                  }
                }
                return (
                  <button
                    key={`${imgUrl}-${i}`}
                    type="button"
                    disabled={locked}
                    onClick={() => answer(imgUrl)}
                    className={`relative flex aspect-[4/3] max-h-32 min-h-[4.5rem] w-full items-center justify-center overflow-hidden rounded-2xl border-4 p-2 shadow-md transition sm:max-h-36 sm:p-2.5 ${ring}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                      draggable={false}
                    />
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
        game="listen"
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
