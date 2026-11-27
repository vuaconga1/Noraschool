"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SeasonCardDecor,
  useForestThemeContextOptional,
} from "@/app/components/games/forest-background";
import { GameBackButton } from "@/app/components/games/GameBackButton";
import { MascotGuide } from "@/app/components/games/MascotGuide";
import {
  ageBandDisplayName,
  themeDisplayName,
  type CurriculumAgeBand,
  type CurriculumMonthTheme,
} from "@/lib/curriculum-themes";

const TOPIC_CARD_BG = {
  nora: "/assets/choosetopic-nora.png",
  classic: "/assets/choosetopic-blue.png",
} as const;

type Props = {
  month: CurriculumMonthTheme;
  ageBands: CurriculumAgeBand[];
  onOpenSidebar?: () => void;
};

type StackSlot = {
  ageBand: CurriculumAgeBand;
  index: number;
  position: "left" | "center" | "right";
};

export function ThemeAgeCards({ month, ageBands, onOpenSidebar }: Props) {
  const router = useRouter();
  const heading = themeDisplayName(month);
  const forest = useForestThemeContextOptional();
  const isNoraTheme = (forest?.theme ?? "wewin") === "wewin";
  const cardBgUrl = isNoraTheme ? TOPIC_CARD_BG.nora : TOPIC_CARD_BG.classic;

  const [activeIndex, setActiveIndex] = useState(0);
  const [cardSize, setCardSize] = useState({ width: 280, height: 356 });
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
  }, [month.slug]);

  useEffect(() => {
    const updateLayout = () => {
      const w = window.innerWidth;
      const h = document.documentElement.clientHeight || window.innerHeight;
      const large = w >= 1024;

      let next = { width: 280, height: 356 };
      if (large) {
        const height = Math.min(Math.floor(h * 0.48), 420);
        const width = Math.round(height * 0.81);
        next = { width, height };
      } else if (w >= 768) {
        const height = Math.min(Math.floor(h * 0.55), 504);
        const width = Math.min(408, Math.round(height * 0.81));
        next = { width, height: Math.round(width / 0.81) };
      } else if (w < 400) {
        const width = Math.min(240, Math.floor(w * 0.66));
        next = { width, height: Math.round(width * 1.27) };
      } else if (w < 640) {
        const width = Math.min(280, Math.floor(w * 0.66));
        next = { width, height: Math.round(width * 1.27) };
      } else {
        const width = Math.min(320, Math.floor(w * 0.5));
        next = { width, height: Math.round(width * 1.25) };
      }

      setIsLargeScreen((prev) => (prev === large ? prev : large));
      setCardSize((prev) =>
        prev.width === next.width && prev.height === next.height ? prev : next,
      );
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  useEffect(() => {
    if (activeIndex >= ageBands.length) setActiveIndex(0);
  }, [activeIndex, ageBands.length]);

  const moveCard = useCallback(
    (direction: -1 | 1) => {
      if (!ageBands.length) return;
      setActiveIndex(
        (current) => (current + direction + ageBands.length) % ageBands.length,
      );
    },
    [ageBands.length],
  );

  const openAge = useCallback(
    (ageId: string) => {
      router.push(`/games/themes/${month.slug}/age/${encodeURIComponent(ageId)}`);
    },
    [month.slug, router],
  );

  const selectCard = useCallback(
    (index: number, position: StackSlot["position"]) => {
      if (position === "center") {
        openAge(ageBands[index].id);
        return;
      }
      setActiveIndex(index);
    },
    [openAge, ageBands],
  );

  const stackedCards = useMemo<StackSlot[]>(() => {
    const total = ageBands.length;
    if (total === 0) return [];
    if (total === 1) {
      return [{ ageBand: ageBands[0], index: 0, position: "center" }];
    }
    const leftIndex = (activeIndex - 1 + total) % total;
    const rightIndex = (activeIndex + 1) % total;
    return [
      { ageBand: ageBands[leftIndex], index: leftIndex, position: "left" },
      { ageBand: ageBands[activeIndex], index: activeIndex, position: "center" },
      { ageBand: ageBands[rightIndex], index: rightIndex, position: "right" },
    ];
  }, [activeIndex, ageBands]);

  if (!ageBands.length) return null;

  const isDesktopStack = cardSize.width >= 360;
  const carouselHeight = cardSize.height + 48;
  const activeAge = ageBands[activeIndex] ?? ageBands[0];
  const weekCount = activeAge.weeks.length;

  const accent = isNoraTheme ? "#BE185D" : "#0E4BA9";
  const titleStyle = {
    color: accent,
    textShadow: "0 2px 0 rgba(255,255,255,0.85), 0 3px 8px rgba(0,0,0,0.25)",
  } as const;
  const metaStyle = {
    color: accent,
    textShadow: "0 1px 0 rgba(255,255,255,0.85), 0 2px 6px rgba(0,0,0,0.2)",
  } as const;
  const headingColor = isNoraTheme ? "#E30076" : "#0E4BA9";

  const renderCardFace = ({
    ageBand,
    emphasized,
    cta,
  }: {
    ageBand: CurriculumAgeBand;
    emphasized: boolean;
    cta: string;
  }) => (
    <>
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${cardBgUrl})` }}
      />
      <SeasonCardDecor compact={!emphasized} />
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-4 sm:px-6 lg:px-5 xl:px-7">
        <div
          className={`w-full font-extrabold leading-tight break-words line-clamp-3 ${
            emphasized
              ? "text-2xl sm:text-3xl md:text-4xl lg:text-2xl xl:text-3xl"
              : "text-lg sm:text-2xl"
          }`}
          style={titleStyle}
        >
          {ageBandDisplayName(ageBand)}
        </div>
        <div
          className={`mt-1 font-bold ${
            emphasized
              ? "text-sm sm:text-lg md:text-xl lg:text-sm xl:text-base"
              : "text-xs sm:text-base"
          }`}
          style={metaStyle}
        >
          {ageBand.weeks.length} tuần · chọn độ tuổi
        </div>
        <div className="mt-3 rounded-full border border-white/40 bg-white/75 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-900 shadow-md backdrop-blur-sm sm:mt-4 sm:px-4 sm:py-1.5 sm:text-sm lg:mt-3 lg:text-xs xl:text-sm">
          {cta}
        </div>
      </div>
    </>
  );

  const renderStackedCard = (slot: StackSlot) => {
    const isCenter = slot.position === "center";
    const positionStyles =
      slot.position === "left"
        ? {
            left: "50%",
            top: "50%",
            transform: isDesktopStack
              ? "translate(-112%, -50%) scale(0.84) rotate(-5deg)"
              : "translate(-102%, -50%) scale(0.86) rotate(-4deg)",
            zIndex: 10,
            opacity: 0.78,
          }
        : slot.position === "right"
          ? {
              left: "50%",
              top: "50%",
              transform: isDesktopStack
                ? "translate(12%, -50%) scale(0.84) rotate(5deg)"
                : "translate(2%, -50%) scale(0.86) rotate(4deg)",
              zIndex: 10,
              opacity: 0.78,
            }
          : {
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%) scale(1)",
              zIndex: 30,
              opacity: 1,
            };

    return (
      <button
        key={`${slot.position}-${slot.ageBand.id}`}
        type="button"
        onClick={() => selectCard(slot.index, slot.position)}
        className={`group absolute overflow-hidden rounded-2xl border text-center transition-[transform,opacity,filter,box-shadow] duration-500 ease-out will-change-transform hover:scale-[1.02] md:rounded-[2rem] ${
          isCenter ? "shadow-2xl ring-4 ring-white/70" : "shadow-xl hover:shadow-2xl"
        }`}
        style={{ width: cardSize.width, height: cardSize.height, ...positionStyles }}
      >
        {renderCardFace({
          ageBand: slot.ageBand,
          emphasized: isCenter,
          cta: isCenter ? "Play now" : slot.position === "left" ? "Preview" : "Next",
        })}
      </button>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-transparent">
      <div className="relative hidden min-h-[52px] items-center justify-center gap-4 px-6 pt-2 pb-2 md:flex">
        {onOpenSidebar && (
          <GameBackButton
            onClick={onOpenSidebar}
            className="absolute left-6 top-2 z-20"
          />
        )}

        <nav
          className="inline-flex items-center gap-3 rounded-xl border border-gray-200/80
                     bg-white/90 px-5 py-3 shadow-md backdrop-blur-sm
                     transition-all hover:shadow-lg"
        >
          {onOpenSidebar ? (
            <button
              type="button"
              onClick={onOpenSidebar}
              className="text-sm font-semibold text-[#DB2777] transition-colors
                         hover:text-[#BE185D] sm:text-base"
            >
              Chủ đề
            </button>
          ) : (
            <span className="text-sm font-semibold text-[#DB2777] sm:text-base">
              Chủ đề
            </span>
          )}
          <span className="text-gray-400">/</span>
          <span className="text-sm font-semibold text-[#BE185D] sm:text-base">
            {heading}
          </span>
        </nav>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 pt-2 pb-4 sm:px-4 sm:pt-3 md:px-6 md:pt-4 md:pb-6">
        <div className="relative z-10 mx-auto mb-2 w-full max-w-7xl shrink-0 md:mb-3">
          <div className="px-2 text-center">
            <h1
              className="mb-1 hidden text-3xl font-bold drop-shadow-lg sm:text-4xl md:block lg:text-5xl"
              style={{ textShadow: "0 12px 25px rgba(0,0,0,0.3)", color: headingColor }}
            >
              {heading}
            </h1>
            <p className="text-base font-medium text-black sm:text-2xl md:text-3xl">
              Choose age group to play
            </p>
          </div>
          <MascotGuide
            variant="inline"
            side="left"
            dismissible={false}
            title={`📜 Chọn độ tuổi: ${ageBandDisplayName(activeAge)}`}
            message={
              isLargeScreen
                ? `Chủ đề “${heading}” có ${ageBands.length} nhóm tuổi · mỗi nhóm có ${weekCount} tuần học.`
                : `Chọn nhóm tuổi rồi vào tuần tương ứng. “${ageBandDisplayName(activeAge)}” có ${weekCount} tuần.`
            }
            className="!mt-2 !mb-2 mx-auto w-full max-w-3xl"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center">
          <div className="mx-auto hidden w-full max-w-7xl px-2 lg:block xl:px-4">
            <div
              className="grid justify-items-center gap-4 xl:gap-6"
              style={{
                gridTemplateColumns: `repeat(${Math.min(ageBands.length, 4)}, minmax(0, 1fr))`,
              }}
            >
              {ageBands.map((ageBand) => (
                <button
                  key={ageBand.id}
                  type="button"
                  onClick={() => openAge(ageBand.id)}
                  className="group relative overflow-hidden rounded-[1.75rem] border text-center shadow-xl ring-2 ring-white/50 transition-[transform,box-shadow] hover:scale-[1.03] hover:shadow-2xl hover:ring-white/80 xl:rounded-[2rem]"
                  style={{
                    width: "100%",
                    maxWidth: cardSize.width,
                    aspectRatio: "0.81",
                  }}
                >
                  {renderCardFace({
                    ageBand,
                    emphasized: true,
                    cta: "Play now",
                  })}
                </button>
              ))}
            </div>
          </div>

          <div
            className="relative mx-auto w-full max-w-6xl lg:hidden"
            style={{ height: carouselHeight }}
          >
            {ageBands.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => moveCard(-1)}
                  className="absolute -left-2 top-1/2 z-40 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/90 text-[#DB2777] shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white md:left-0 md:h-12 md:w-12"
                  aria-label="Độ tuổi trước"
                >
                  <svg className="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveCard(1)}
                  className="absolute -right-2 top-1/2 z-40 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/90 text-[#DB2777] shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white md:right-0 md:h-12 md:w-12"
                  aria-label="Độ tuổi sau"
                >
                  <svg className="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </>
            )}

            <div className="relative h-full w-full overflow-visible">
              {stackedCards.map((slot) => renderStackedCard(slot))}
            </div>
          </div>

          {ageBands.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2 px-4 md:mt-6 lg:hidden">
              {ageBands.map((ageBand, index) => (
                <button
                  key={ageBand.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === activeIndex ? "w-6 bg-[#DB2777]" : "w-2 bg-pink-300 hover:bg-pink-400"
                  }`}
                  aria-label={ageBandDisplayName(ageBand)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
