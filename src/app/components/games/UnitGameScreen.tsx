"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { GameMenu } from "@/app/components/games/GameMenu";
import { UnitProgress } from "@/app/components/games/UnitProgress";
import { PartSelectionScreen } from "@/app/components/games/PartSelectionScreen";
import Notification from "@/app/components/notification";
import { RightLeaderboardSidebar } from "@/app/components/games/RightLeaderboardSidebar";
import { GameMobileToolbar } from "@/app/components/games/GameMobileToolbar";
import { ForestPageShell } from "@/app/components/games/forest-background";
import { GameBackButton } from "@/app/components/games/GameBackButton";
import { leaderboardPathForBookType } from "@/lib/games/bookRoutes";
import { GAMES_LIBRARY_PATH, syncLeaderboardPair } from "@/lib/games/leaderboardNav";

import type { GameKey, UnitGameConfig } from "@/types/games";
import { DEFAULT_ENABLED_GAMES } from "@/types/games";
import { useStudentStore } from "@/stores/student.store";
import { leaderboardService } from "@/services/leaderboard.service";
import { gameProgressService } from "../../../services/game-progress.service";

import {
  submitScoreToSheet,
  getGameId,
  resetUnitToSheet,
} from "@/app/utils/submitScore";

/* ---------------------------------------------------
    TYPES
-----------------------------------------------------*/

type UnitGameScreenProps = {
  unit: UnitGameConfig;
  heading: string;
  subheading?: string;
  showBreadcrumb?: boolean;
  breadcrumbBackUrl?: string;
  breadcrumbBackLabel?: string;
  /**
   * Canonical URL for this unit page when it is NOT `{breadcrumbBackUrl}/{unit.slug}`
   * (e.g. theme weeks: `/games/themes/2026-09/week/1`).
   */
  unitPath?: string;
  initialPlayerId?: string;
  showIdModal?: boolean;
  onPlayerIdSubmit?: (id: string) => void;
  onPlayerIdSkip?: () => void;
  unitIndex?: number;
  /** Mở sidebar danh sách Unit (mobile toolbar) */
  onOpenUnitsSidebar?: () => void;
  /**
   * Parent already wraps ForestPageShell (e.g. theme week + sidebar).
   * Avoid nested shell so footer stays full-width below the sidebar row.
   */
  embedded?: boolean;
};

type ProgressState = Record<GameKey, boolean>;
type ScoreState = Record<GameKey, number>;

/* ---------------------------------------------------
    IDLE HELPERS (avoid blocking render)
-----------------------------------------------------*/

const runIdle = (cb: () => void) => {
  if (typeof window === "undefined") return;
  // Prefer idle callback, fallback to timeout
  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout?: number }) => number)
    | undefined;
  if (ric) {
    ric(cb, { timeout: 300 });
  } else {
    setTimeout(cb, 0);
  }
};

/* ---------------------------------------------------
    DEFAULT STATE HELPERS
-----------------------------------------------------*/

const createDefaultProgress = (): ProgressState => ({
  matching: false,
  flip: false,
  speak: false,
  memory: false,
  ordering: false,
  scramble: false,
  listen: false,
  look: false,
  catch: false,
});

const createDefaultScores = (): ScoreState => ({
  matching: 0,
  flip: 0,
  speak: 0,
  memory: 0,
  ordering: 0,
  scramble: 0,
  listen: 0,
  look: 0,
  catch: 0,
});

/* ---------------------------------------------------
    GAME TITLE MAP
-----------------------------------------------------*/

const GAME_TITLES: Record<GameKey, string> = {
  matching: "Matching Game",
  flip: "Flip Card Game",
  speak: "Pronunciation Game",
  memory: "Memory Game",
  ordering: "Word Ordering Game",
  scramble: "Word Scramble Game",
  listen: "Listen & Choose",
  look: "Look & Choose",
  catch: "Catching",
};

/* ---------------------------------------------------
    MAIN COMPONENT
-----------------------------------------------------*/

export function UnitGameScreen({
  unit,
  heading,
  subheading,
  showBreadcrumb = false,
  breadcrumbBackUrl = "/resources/kids/Games",
  breadcrumbBackLabel = "Kids Book",
  unitPath,
  initialPlayerId = "",
  showIdModal: externalShowIdModal,
  onPlayerIdSubmit: externalOnPlayerIdSubmit,
  onPlayerIdSkip: externalOnPlayerIdSkip,
  unitIndex,
  onOpenUnitsSidebar,
  embedded = false,
}: UnitGameScreenProps) {

  const displayUnitName = unit.name;

  const parts = unit.parts ?? [];
  const partIdsKey = useMemo(() => parts.map((p) => p.id).join("|"), [parts]);
  const hasParts = parts.length > 0;
  const multipleParts = parts.length > 1;
  const navigationEnabled = hasParts && multipleParts;

  const router = useRouter();
  const pathname = usePathname();

  // Memoized storage keys to keep dependencies stable
  const modeStorageKey = useMemo(() => `${unit.slug}_mode`, [unit.slug]);
  const partStorageKey = useMemo(() => `${unit.slug}_selected_part`, [unit.slug]);

  /* ---------------------------------------------------
      PATH PARSER → xác định view hiện tại
  -----------------------------------------------------*/

  const getViewFromPath = (path: string): GameKey | "menu" => {
    const segments = path.split("/").filter(Boolean);
    const last = segments[segments.length - 1];

    const valid: GameKey[] = [
      "flip",
      "speak",
      "memory",
      "ordering",
      "scramble",
      "listen",
      "look",
      "catch",
    ];

    return valid.includes(last as GameKey)
      ? (last as GameKey)
      : "menu";
  };

  const getPartFromPath = (path: string): string | null => {
    const segments = path.split("/").filter(Boolean);
    const validGames: GameKey[] = [
      "flip",
      "speak",
      "memory",
      "ordering",
      "scramble",
      "listen",
      "look",
      "catch",
    ];

    // Case 1: .../[slug]/[part]/[game]
    if (segments.length >= 5) {
      const last = segments[segments.length - 1];
      const maybePart = segments[segments.length - 2];
      if (validGames.includes(last as GameKey) && parts.some((p) => p.id === maybePart)) {
        return maybePart;
      }
    }

    // Case 2: .../[slug]/[part]
    if (segments.length >= 4) {
      const maybePart = segments[segments.length - 1];
      if (parts.some((p) => p.id === maybePart)) return maybePart;
    }

    return null;
  };

  /* ---------------------------------------------------
      STATE: mode, selectedPart, playerId
  -----------------------------------------------------*/

  const initialPartFromPath = getPartFromPath(pathname);

  const [mode, setMode] = useState<"select" | "play">(() => {
    if (initialPartFromPath && parts.some((p) => p.id === initialPartFromPath)) {
      return "play";
    }
    // Nếu unit có nhiều part nhưng URL không chỉ định part → ở màn chọn part
    if (hasParts && multipleParts) return "select";
    return hasParts ? "play" : "play";
  });

const [selectedPartId, setSelectedPartId] = useState(() => {
    if (initialPartFromPath && parts.some((p) => p.id === initialPartFromPath)) {
      return initialPartFromPath;
    }
    if (typeof window !== "undefined" && hasParts) {
      const saved = sessionStorage.getItem(partStorageKey);
      if (saved && parts.some((p) => p.id === saved)) return saved;
    }
    // Không ép chọn part khi unit có nhiều part và URL không chỉ định part
    return hasParts && !multipleParts && parts[0] ? parts[0].id : "default";
  });

  const [internalPlayerId, setInternalPlayerId] = useState("guest");

  // Player ID modal removed — always play as guest / session id when provided.
  void externalShowIdModal;
  void externalOnPlayerIdSubmit;
  void externalOnPlayerIdSkip;
  const playerId = initialPlayerId || internalPlayerId || "guest";

  /* ---------------------------------------------------
      STATE: progress, scores, current view
  -----------------------------------------------------*/

  const [progress, setProgress] = useState<ProgressState>(createDefaultProgress());
  const [scores, setScores] = useState<ScoreState>(createDefaultScores());

  const [currentView, setCurrentView] = useState<GameKey | "menu">(
    getViewFromPath(pathname)
  );

  const [notificationVisible, setNotificationVisible] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const [isPending, startTransition] = useTransition();

  const studentSession = useStudentStore((s) => s.session);

  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardRefreshToken, setLeaderboardRefreshToken] = useState(0);

  /* ---------------------------------------------------
      REFS: track previous unit, playerId, part
  -----------------------------------------------------*/

  const prevUnitSlugRef = useRef<string | null>(null);
  const isReturningToMenuRef = useRef(false);

  const prevPlayerIdRef = useRef(playerId);
  const prevPartIdRef = useRef<string>(selectedPartId || "default");
/* ---------------------------------------------------
    useEffect 1 — xử lý khi unit thay đổi
-----------------------------------------------------*/
useEffect(() => {
  if (typeof window === "undefined") return;

  const unitChanged =
    prevUnitSlugRef.current !== null &&
    prevUnitSlugRef.current !== unit.slug;

  const isFirstMount = prevUnitSlugRef.current === null;

  if ((unitChanged || isFirstMount) && !isReturningToMenuRef.current) {
    startTransition(() => {
      const pathPart = getPartFromPath(pathname);
      const firstPartId =
        hasParts && parts[0] ? parts[0].id : "default";

      // Nếu URL đã có part hợp lệ → chọn part đó và mode = play
      if (pathPart && parts.some((p) => p.id === pathPart)) {
        setMode("play");
        setSelectedPartId(pathPart);
        sessionStorage.setItem(modeStorageKey, "play");
        sessionStorage.setItem(partStorageKey, pathPart);
      } else {
        // Unit có nhiều part nhưng URL không chỉ định part → về màn chọn part
        if (hasParts && multipleParts) {
          setMode("select");
          setSelectedPartId("");
          sessionStorage.setItem(modeStorageKey, "select");
          sessionStorage.setItem(partStorageKey, "");
        } else {
          // Unit 1 part hoặc không có part
          const initialPart = hasParts ? firstPartId : "default";
          setMode("play");
          setSelectedPartId(initialPart);
          sessionStorage.setItem(modeStorageKey, "play");
          sessionStorage.setItem(partStorageKey, initialPart);
        }
      }

      prevUnitSlugRef.current = unit.slug;
    });
  }
}, [unit.slug, hasParts, multipleParts, parts.length, pathname, modeStorageKey, partStorageKey]);

/* ---------------------------------------------------
    useEffect 2 — xử lý khi URL/pathname thay đổi
-----------------------------------------------------*/
useEffect(() => {
  const view = getViewFromPath(pathname);
  const partFromPath = getPartFromPath(pathname);

  startTransition(() => {
    setCurrentView(view);

    if (!hasParts) return;
    if (!navigationEnabled) return;

    const modeKey = `${unit.slug}_mode`;
    const partKey = `${unit.slug}_selected_part`;

    // Nếu URL chứa partId hợp lệ, đồng bộ selectedPartId
    if (partFromPath && parts.some((p) => p.id === partFromPath)) {
      setSelectedPartId(partFromPath);
      sessionStorage.setItem(partKey, partFromPath);
      // Khi URL đã có part hợp lệ, luôn ở mode play để không bật lại màn chọn part
      setMode("play");
      sessionStorage.setItem(modeKey, "play");
    }

    const isGameView =
      view === "flip" ||
      view === "speak" ||
      view === "memory" ||
      view === "ordering" ||
      view === "scramble" ||
      view === "listen" ||
      view === "look" ||
      view === "catch";

    if (isGameView) {
      setMode("play");
      sessionStorage.setItem(modeKey, "play");

      if (!selectedPartId && parts.length > 0) {
        const first = parts[0].id;
        setSelectedPartId(first);
        sessionStorage.setItem(partKey, first);
      }
    }

    // Nếu ở view menu nhưng URL đã chứa part → đảm bảo mode play
    if (!isGameView && partFromPath) {
      setMode("play");
      sessionStorage.setItem(modeKey, "play");
    }

    // QUAN TRỌNG: view === "menu" → KHÔNG ép mode
    // => giữ nguyên mode = "select" nếu user đang ở màn chọn part
  });
}, [
  pathname,
  navigationEnabled,
  hasParts,
  selectedPartId,
  partIdsKey,
  unit.slug,
]);

/* ---------------------------------------------------
    useEffect 3 — mark hydration + load initial playerId nếu có
-----------------------------------------------------*/
useEffect(() => {
  setIsHydrated(true);

  if (initialPlayerId) {
    setInternalPlayerId(initialPlayerId);
  }
}, [initialPlayerId]);

/* ---------------------------------------------------
    activePart memo
-----------------------------------------------------*/
const activePart = useMemo(() => {
  if (!hasParts || parts.length === 0) return undefined;
  return (
    parts.find((p) => p.id === selectedPartId) || parts[0]
  );
}, [hasParts, parts, selectedPartId]);

/* ---------------------------------------------------
    useEffect 4 — xử lý reload trang (reset session)
-----------------------------------------------------*/
const RELOAD_FLAG_KEY = `unit_game_reload_${unit.slug}`;

useEffect(() => {
  if (typeof window === "undefined") return;

  const beforeUnload = () => {
    sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
  };

  window.addEventListener("beforeunload", beforeUnload);

  return () => window.removeEventListener("beforeunload", beforeUnload);
}, [RELOAD_FLAG_KEY]);

/* ---------------------------------------------------
    useEffect 5 — load progress từ DB hoặc session cache
-----------------------------------------------------*/
useEffect(() => {
  if (!isHydrated || typeof window === "undefined") return;

  runIdle(() => {
    const bookPrefix = unit.bookname
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const partKey = activePart ? activePart.id : "default";
    const playerKey = playerId || "guest";

    const progressKey = `progress_${bookPrefix}_${unit.slug}_${partKey}_${playerKey}`;

    const loadProgress = async () => {
      try {
        const remote = await gameProgressService.get({
          playerId: playerKey,
          unitSlug: unit.slug,
          partId: partKey,
        });

        if (remote) {
          setProgress({
            ...createDefaultProgress(),
            ...(remote.progress || {}),
          });
          setScores({
            ...createDefaultScores(),
            ...(remote.scores || {}),
          });
          sessionStorage.setItem(
            progressKey,
            JSON.stringify({
              progress: remote.progress || {},
              scores: remote.scores || {},
            })
          );
          sessionStorage.removeItem(RELOAD_FLAG_KEY);
          return;
        }
      } catch {
        // Fallback bên dưới sẽ xử lý nếu API lỗi
      }

      try {
        const saved = sessionStorage.getItem(progressKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setProgress({
            ...createDefaultProgress(),
            ...(parsed.progress || {}),
          });
          setScores({
            ...createDefaultScores(),
            ...(parsed.scores || {}),
          });
          sessionStorage.removeItem(RELOAD_FLAG_KEY);
          return;
        }
      } catch {}

      setProgress(createDefaultProgress());
      setScores(createDefaultScores());
      sessionStorage.removeItem(RELOAD_FLAG_KEY);
    };

    void loadProgress();
  });
}, [
  isHydrated,
  unit.slug,
  unit.bookname,
  activePart?.id,
  playerId,
  RELOAD_FLAG_KEY,
]);

/* ---------------------------------------------------
    useEffect 6 — lưu progress & scores vào sessionStorage
-----------------------------------------------------*/
useEffect(() => {
  if (!isHydrated || typeof window === "undefined") return;

  const hasProgress = Object.values(progress).some((v) => v);
  const hasScore = Object.values(scores).some((v) => v > 0);

  if (!hasProgress && !hasScore) return;

  runIdle(() => {
    const bookPrefix = unit.bookname
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const partKey = activePart ? activePart.id : "default";
    const playerKey = playerId || "guest";

    const progressKey = `progress_${bookPrefix}_${unit.slug}_${partKey}_${playerKey}`;

    try {
      sessionStorage.setItem(
        progressKey,
        JSON.stringify({ progress, scores })
      );

      void gameProgressService.save({
        playerId: playerKey,
        unitSlug: unit.slug,
        partId: partKey,
        bookname: unit.bookname,
        progress,
      });
    } catch {}
  });
}, [
  isHydrated,
  progress,
  scores,
  unit.bookname,
  unit.slug,
  activePart?.id,
  playerId,
]);

/* ---------------------------------------------------
    useEffect 7 — reset progress khi đổi playerId hoặc part
-----------------------------------------------------*/


useEffect(() => {
  const playerChanged = prevPlayerIdRef.current !== playerId;
  const partChanged = prevPartIdRef.current !== (activePart?.id || "default");

  if (playerChanged || partChanged) {
    const bookPrefix = unit.bookname
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const oldPart = prevPartIdRef.current;
    const oldPlayer = prevPlayerIdRef.current || "guest";

    const oldKey = `progress_${bookPrefix}_${unit.slug}_${oldPart}_${oldPlayer}`;
    sessionStorage.removeItem(oldKey);

    setProgress(createDefaultProgress());
    setScores(createDefaultScores());

    prevPlayerIdRef.current = playerId;
    prevPartIdRef.current = activePart?.id || "default";
  }
}, [playerId, activePart?.id, unit.bookname, unit.slug]);

/* ---------------------------------------------------
    ACTIVE PART TITLE
-----------------------------------------------------*/
const getPartTitle = useMemo(() => {
  if (!activePart || !hasParts) return "";
  const idx = parts.findIndex((p) => p.id === activePart.id);
  return idx >= 0 ? `Part ${idx + 1}` : "";
}, [activePart, hasParts, parts]);

/* ---------------------------------------------------
    WORDS
-----------------------------------------------------*/
const words = activePart ? activePart.words : unit.flashcards.words;

/* ---------------------------------------------------
    ENABLED GAMES (FIXED – NO DYNAMIC DEPS)
-----------------------------------------------------*/
const enabledGames = useMemo(() => {
  if (activePart?.enabledGames) return activePart.enabledGames;
  if (unit.enabledGames) return unit.enabledGames;
  return DEFAULT_ENABLED_GAMES;
}, [activePart?.enabledGames, unit.enabledGames]);

/* ---------------------------------------------------
    LOCAL PROGRESS KEY (TÍNH TRỰC TIẾP, KHÔNG LƯU TRONG STATE)
-----------------------------------------------------*/
const progressKey = useMemo(() => {
  const bookPrefix = unit.bookname
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const partKey = activePart ? activePart.id : "default";
  const playerKey = playerId || "guest";

  return `progress_${bookPrefix}_${unit.slug}_${partKey}_${playerKey}`;
}, [unit.bookname, unit.slug, activePart, playerId]);

const unitBasePath = unitPath ?? `${breadcrumbBackUrl}/${unit.slug}`;

const buildPartUrl = () => {
  if (navigationEnabled && selectedPartId) {
    return `${unitBasePath}/${selectedPartId}`;
  }
  return unitBasePath;
};

/* ---------------------------------------------------
    HANDLE RESET UNIT
-----------------------------------------------------*/
const handleReset = () => {
  const allDone = enabledGames.every((g) => progress[g]);

  if (!allDone) {
    const missing = enabledGames.filter((g) => !progress[g]);
    const names = missing.map((g) => GAME_TITLES[g]).join(", ");
    alert(
      `Bạn cần hoàn thành tất cả các game trước khi reset!\n\nCòn thiếu: ${names}`
    );
    return;
  }

  if (!confirm("Bạn có chắc muốn reset toàn bộ tiến độ Unit này không?")) {
    return;
  }

  const unitDisplayName = activePart
    ? `${unit.name} · ${getPartTitle}`
    : unit.name;

  void gameProgressService.clear({
    playerId: playerId || "guest",
    unitSlug: unit.slug,
    partId: activePart ? activePart.id : "default",
  }).catch(() => {
    // ignore
  });

  resetUnitToSheet({
    id: playerId || "anonymous",
    unit: unit.unit,
    project: unitDisplayName,
    bookname: unit.bookname,
  });

  setProgress(createDefaultProgress());
  setScores(createDefaultScores());

  sessionStorage.removeItem(progressKey);
};

/* ---------------------------------------------------
    HANDLE GAME COMPLETE (AUTO NAVIGATE, AUTO SAVE)
-----------------------------------------------------*/

const processingGamesRef = useRef<Set<GameKey>>(new Set());

const handleGameComplete = (
  game: GameKey,
  score?: number,
  maxScore?: number,
  itemCount?: number,
) => {
  if (!enabledGames.includes(game)) return;

  // Submit điểm lên bảng xếp hạng kể cả khi chơi lại (best-score upsert).
  // Không phụ thuộc studentSession — backend tự verify playerId.
  const submitPlayerId =
    studentSession?.playerId ||
    (playerId && playerId !== "anonymous" && playerId !== "guest"
      ? playerId
      : null);

  if (typeof score === "number" && submitPlayerId) {
    leaderboardService
      .submit({
        playerId: submitPlayerId,
        unitSlug: unit.slug,
        partId: activePart?.id || "default",
        gameType: game,
        score,
        bookType: unit.bookType,
        maxScore: maxScore && maxScore > 0 ? maxScore : undefined,
        itemCount: itemCount && itemCount > 0 ? itemCount : undefined,
      })
      .then(() => {
        setLeaderboardRefreshToken((v) => v + 1);
      })
      .catch((err) => {
        console.warn("[leaderboard] submit failed", err);
      });
  }

  if (processingGamesRef.current.has(game) || progress[game]) {
    return;
  }

  processingGamesRef.current.add(game);

  const displayScore = typeof score === "number" ? score : 100;

  setProgress((prev) => {
    if (prev[game]) return prev;
    return { ...prev, [game]: true };
  });

  setScores((prev) => ({ ...prev, [game]: displayScore }));

  // Gửi điểm lên Sheet nếu game có score
  if (score !== undefined && ["speak", "memory"].includes(game)) {
    const unitDisplayName = activePart
      ? `${unit.name} · ${getPartTitle}`
      : unit.name;

    submitScoreToSheet({
      id: playerId || "anonymous",
      unit: unit.unit,
      project: unitDisplayName,
      game_id: getGameId(game),
      score,
      bookname: unit.bookname,
    });
  }

  setTimeout(() => {
    processingGamesRef.current.delete(game);
  }, 250);

  const gameTitle = GAME_TITLES[game];

  setNotificationMessage(`🎉 Bạn đã hoàn thành ${gameTitle}!`);
  setNotificationVisible(true);
};

/* ---------------------------------------------------
    HANDLE SELECT PART
-----------------------------------------------------*/
const handleSelectPart = (partId: string) => {
  setSelectedPartId(partId);
  setMode("play");
  setCurrentView("menu");

  const partKey = `${unit.slug}_selected_part`;
  const modeKey = `${unit.slug}_mode`;

  sessionStorage.setItem(partKey, partId);
  sessionStorage.setItem(modeKey, "play");
  // Sử dụng replace để không thêm history và tránh cần click lần 2
  router.replace(
    unitPath ? `${unitBasePath}` : `${unitBasePath}/${partId}`,
  );
};

/* ---------------------------------------------------
    GO TO MENU (TRỞ LẠI CHỌN GAME)
-----------------------------------------------------*/
const goToMenu = () => {
  isReturningToMenuRef.current = true;

  const modeKey = `${unit.slug}_mode`;
  sessionStorage.setItem(modeKey, "play");

  startTransition(() => {
    setCurrentView("menu");
    router.replace(buildPartUrl());
  });

  setTimeout(() => {
    isReturningToMenuRef.current = false;
  }, 400);
};

const handleBack = useCallback(() => {
  if (currentView !== "menu") {
    goToMenu();
    return;
  }

  if (multipleParts && getPartFromPath(pathname)) {
    router.push(unitBasePath);
    return;
  }

  router.push(breadcrumbBackUrl || GAMES_LIBRARY_PATH);
}, [
  pathname,
  router,
  currentView,
  multipleParts,
  breadcrumbBackUrl,
  unitBasePath,
]);

useEffect(() => {
  syncLeaderboardPair(pathname);
}, [pathname]);

/* ---------------------------------------------------
    JSX — UI RENDER
-----------------------------------------------------*/

const shellProps = {
  showThemeSwitcher: true as boolean,
  leaderboardHref: leaderboardPathForBookType(unit.bookType),
};

const wrapShell = (node: ReactNode, showSwitcher: boolean) => {
  if (embedded) return node;
  return (
    <ForestPageShell
      showThemeSwitcher={showSwitcher}
      leaderboardHref={shellProps.leaderboardHref}
    >
      {node}
    </ForestPageShell>
  );
};

// Nếu đang ở chế độ chọn part và có nhiều part, hiển thị màn chọn part
if (mode === "select" && multipleParts) {
  return wrapShell(
    <>
      <PartSelectionScreen
        unit={unit}
        heading={heading}
        onSelectPart={handleSelectPart}
        showBreadcrumb={showBreadcrumb}
        breadcrumbBackUrl={breadcrumbBackUrl}
        breadcrumbBackLabel={breadcrumbBackLabel}
        onOpenUnitsSidebar={onOpenUnitsSidebar}
      />
    </>,
    true,
  );
}

return wrapShell(
  <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-transparent pb-14 md:pb-12">

    <GameMobileToolbar
      onBack={handleBack}
      onOpenUnits={onOpenUnitsSidebar}
      onToggleLeaderboard={() => setLeaderboardOpen((v) => !v)}
      showLeaderboard={currentView !== "menu"}
      title={
        currentView === "menu"
          ? displayUnitName
          : GAME_TITLES[currentView]
      }
      subtitle={
        currentView !== "menu" ? displayUnitName : undefined
      }
    />

    {/* Breadcrumb — desktop only */}
    {showBreadcrumb && (
      <div className="hidden md:flex relative pt-2 pb-2 px-6 min-h-[52px] items-center justify-center gap-4">
        <GameBackButton
          onClick={handleBack}
          className="absolute left-6 top-2 z-20"
        />

        <nav className="inline-flex items-center gap-3 px-5 py-3
                        bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/80
                        shadow-md hover:shadow-lg transition-all">

          {/* Crumb 1 — về trang chọn tuần / sách */}
          <Link
            href={breadcrumbBackUrl || GAMES_LIBRARY_PATH}
            className="text-[#DB2777] hover:text-[#BE185D]
                       font-semibold transition-colors group text-sm sm:text-base"
          >
            {breadcrumbBackLabel}
          </Link>

          <span className="text-gray-400">/</span>

          {currentView === "menu" ? (
            <span className="font-semibold text-sm text-[#BE185D] sm:text-base">
              {unit.name}
            </span>
          ) : (
            <>
              <Link
                href={unitBasePath}
                className="text-[#DB2777] hover:text-[#BE185D]
                           font-semibold transition-colors text-sm sm:text-base"
              >
                {unit.name}
              </Link>

              <span className="text-gray-400">/</span>

              <span className="font-semibold text-sm text-[#BE185D] sm:text-base">
                {GAME_TITLES[currentView]}
              </span>
            </>
          )}
        </nav>
      </div>
    )}

    {/* Title — desktop only (mobile: toolbar); compact to fit cards */}
    <div className="mx-auto hidden max-w-7xl shrink-0 flex-col items-center gap-1 px-4 pt-1 text-center md:mb-0 md:flex md:pt-1">

      <h1
        className="mb-0 max-w-full break-words px-2 text-lg font-bold text-white drop-shadow-lg sm:text-2xl md:text-3xl lg:text-4xl"
        style={{ textShadow: "0 12px 25px rgba(0,0,0,0.3)", color: "#E30076" }}
      >
        {displayUnitName}
      </h1>

      {/* Internal back buttons removed — unified back button is now in the breadcrumb row above */}
    </div>

    {/* ---------------------------------------------------
          MAIN CONTENT: GameMenu + Progress
    -----------------------------------------------------*/}
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <GameMenu
        key={activePart ? `${unit.slug}-${activePart.id}` : unit.slug}
        title={displayUnitName}
        words={words}
        description="Choose game to play"
        autoAudio={unit.flashcards.autoAudio}
        enabledGames={enabledGames}
        orderingTitle={unit.wordOrdering?.title}
        scrambleTitle={unit.wordScramble?.title}
        orderingShowScore={unit.wordOrdering?.showScore}
        scrambleShowScore={unit.wordScramble?.showScore}
        onGameComplete={handleGameComplete}
        slug={unit.slug}
        bookType={unit.bookType}
      partId={activePart?.id}
        activeView={currentView}
        onChangeView={setCurrentView}
        onChooseOtherGame={goToMenu}
        progress={progress}
        scores={scores}
      />

      <UnitProgress
        title={displayUnitName}
        games={enabledGames}
        progress={progress}
        scores={scores}
        onReset={handleReset}
      />
    </div>

    {/* ---------------------------------------------------
          RIGHT SIDEBAR: LEADERBOARD
    -----------------------------------------------------*/}
    {currentView !== "menu" && (
      <RightLeaderboardSidebar
        open={leaderboardOpen}
        onToggle={() => setLeaderboardOpen((v) => !v)}
        unitSlug={unit.slug}
        partId={activePart?.id || "default"}
        gameType={currentView}
        refreshToken={leaderboardRefreshToken}
      />
    )}

    {/* ---------------------------------------------------
          MODALS + NOTIFICATIONS
    -----------------------------------------------------*/}

    <Notification
      message={notificationMessage}
      type="success"
      visible={notificationVisible}
      onClose={() => setNotificationVisible(false)}
    />
  </div>,
  currentView === "menu",
);
}


