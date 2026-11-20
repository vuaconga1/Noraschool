"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type TouchEvent,
} from "react";
import { ThemeMonthCard } from "@/app/components/games/ThemeMonthCard";
import type { CurriculumMonthTheme } from "@/lib/curriculum-themes";

type Props = {
  months: CurriculumMonthTheme[];
};

type StackSlot = {
  month: CurriculumMonthTheme;
  index: number;
  position: "left" | "center" | "right";
};

function peekTransform(
  position: "left" | "center" | "right",
  wide: boolean,
): CSSProperties {
  if (position === "left") {
    return {
      left: "50%",
      top: "50%",
      transform: wide
        ? "translate(-112%, -50%) scale(0.84) rotate(-4deg)"
        : "translate(-102%, -50%) scale(0.86) rotate(-3deg)",
      zIndex: 10,
      opacity: 0.78,
    };
  }
  if (position === "right") {
    return {
      left: "50%",
      top: "50%",
      transform: wide
        ? "translate(12%, -50%) scale(0.84) rotate(4deg)"
        : "translate(2%, -50%) scale(0.86) rotate(3deg)",
      zIndex: 10,
      opacity: 0.78,
    };
  }
  return {
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%) scale(1)",
    zIndex: 30,
    opacity: 1,
  };
}

export function ThemeMonthsCarousel({ months }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardSize, setCardSize] = useState({ width: 300, height: 280 });
  const [wide, setWide] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setWide(w >= 640);
      if (w < 400) {
        setCardSize({ width: Math.min(260, Math.floor(w * 0.72)), height: 260 });
      } else if (w < 640) {
        setCardSize({ width: Math.min(300, Math.floor(w * 0.68)), height: 280 });
      } else {
        const width = Math.min(340, Math.floor(w * 0.42));
        setCardSize({ width, height: Math.min(300, Math.floor(h * 0.42)) });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const go = useCallback(
    (dir: -1 | 1) => {
      setActiveIndex((i) => {
        const next = i + dir;
        if (next < 0) return months.length - 1;
        if (next >= months.length) return 0;
        return next;
      });
    },
    [months.length],
  );

  const slots: StackSlot[] = useMemo(() => {
    if (!months.length) return [];
    const left = (activeIndex - 1 + months.length) % months.length;
    const right = (activeIndex + 1) % months.length;
    return [
      { month: months[left], index: left, position: "left" },
      { month: months[activeIndex], index: activeIndex, position: "center" },
      { month: months[right], index: right, position: "right" },
    ];
  }, [activeIndex, months]);

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    go(dx < 0 ? 1 : -1);
  };

  return (
    <div className="w-full">
      <div
        className="relative mx-auto"
        style={{ height: Math.max(cardSize.height + 48, 320) }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {slots.map(({ month, index, position }) => (
          <div
            key={`${month.slug}-${position}`}
            className="absolute transition-all duration-400 ease-out"
            style={{
              width: cardSize.width,
              ...peekTransform(position, wide),
              pointerEvents: position === "center" ? "auto" : "none",
            }}
          >
            <ThemeMonthCard month={month} index={index} />
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          className="rounded-full bg-white/85 px-3 py-1.5 text-sm font-semibold text-slate-700 shadow"
          aria-label="Tháng trước"
        >
          ←
        </button>
        <p className="text-sm font-medium text-slate-800">
          {activeIndex + 1} / {months.length}
        </p>
        <button
          type="button"
          onClick={() => go(1)}
          className="rounded-full bg-white/85 px-3 py-1.5 text-sm font-semibold text-slate-700 shadow"
          aria-label="Tháng sau"
        >
          →
        </button>
      </div>
    </div>
  );
}
