/** Soft sakura petals for light-pink sidebars (attendance / spring look). */

const BLOSSOMS = [
  { emoji: "🌸", className: "left-3 top-24 text-2xl opacity-40 rotate-[-18deg]" },
  { emoji: "💮", className: "right-4 top-36 text-xl opacity-30 rotate-[22deg]" },
  { emoji: "🌸", className: "left-8 top-[45%] text-3xl opacity-25 rotate-[12deg]" },
  { emoji: "🌸", className: "right-6 top-[58%] text-2xl opacity-35 rotate-[-8deg]" },
  { emoji: "💮", className: "left-5 bottom-28 text-xl opacity-30 rotate-[16deg]" },
  { emoji: "🌸", className: "right-8 bottom-16 text-2xl opacity-25 rotate-[-20deg]" },
  { emoji: "🌸", className: "left-1/2 top-[72%] -translate-x-1/2 text-lg opacity-20 rotate-[6deg]" },
] as const;

export function CherryBlossomDecor() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {BLOSSOMS.map((item, index) => (
        <span
          key={`${item.emoji}-${index}`}
          className={`absolute select-none drop-shadow-sm ${item.className}`}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
}
