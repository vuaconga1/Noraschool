import { prisma } from "@/lib/prisma";
import { ensureStudent } from "@/server/students";

function makeGameKey(unitSlug: string, partId: string, gameType: string) {
  return `${unitSlug}:${partId}:${gameType}`;
}

function getVietnamYearMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);
  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
  };
}

async function resolveBookType(unitSlug: string, fallback?: string) {
  if (fallback?.trim()) return fallback.trim();
  const unit = await prisma.gameUnit.findUnique({ where: { slug: unitSlug } });
  return unit?.bookType?.trim() || "unknown";
}

export async function submitBestScore(input: {
  playerId: string;
  unitSlug: string;
  partId?: string;
  gameType: string;
  score: number;
  maxScore?: number;
  itemCount?: number;
  bookType?: string;
  playerName?: string;
}) {
  const student = await ensureStudent(input.playerId, input.playerName);
  const unitSlug = input.unitSlug.trim();
  const partId = input.partId?.trim() || "default";
  const gameType = input.gameType.trim();
  const gameKey = makeGameKey(unitSlug, partId, gameType);
  const bookType = await resolveBookType(unitSlug, input.bookType);
  const { year, month } = getVietnamYearMonth();

  try {
    await prisma.gameAttempt.create({
      data: {
        playerId: student.playerId,
        studentId: student.id,
        unitSlug,
        partId,
        gameType,
        bookType,
        score: input.score,
        maxScore: input.maxScore ?? null,
        itemCount: input.itemCount ?? null,
      },
    });
  } catch (err) {
    console.error("game_attempts insert failed", err);
  }

  const existing = await prisma.gameScore.findUnique({
    where: { gameKey_studentId: { gameKey, studentId: student.id } },
  });

  let bestScore = input.score;
  if (!existing) {
    const created = await prisma.gameScore.create({
      data: {
        gameKey,
        unitSlug,
        partId,
        gameType,
        bestScore: input.score,
        studentId: student.id,
      },
    });
    bestScore = created.bestScore;
  } else if (input.score > existing.bestScore) {
    const updated = await prisma.gameScore.update({
      where: { id: existing.id },
      data: { bestScore: input.score },
    });
    bestScore = updated.bestScore;
  } else {
    bestScore = existing.bestScore;
  }

  const monthly = await prisma.monthlyGameScore.findUnique({
    where: {
      studentId_gameKey_year_month: {
        studentId: student.id,
        gameKey,
        year,
        month,
      },
    },
  });

  if (!monthly) {
    await prisma.monthlyGameScore.create({
      data: {
        bookType,
        year,
        month,
        gameKey,
        unitSlug,
        partId,
        gameType,
        bestScore: input.score,
        studentId: student.id,
      },
    });
  } else if (input.score > monthly.bestScore) {
    await prisma.monthlyGameScore.update({
      where: { id: monthly.id },
      data: { bestScore: input.score, bookType },
    });
  }

  return { bestScore };
}

export async function getTop(input: {
  unitSlug: string;
  partId?: string;
  gameType: string;
  limit?: number;
}) {
  const gameKey = makeGameKey(
    input.unitSlug.trim(),
    input.partId?.trim() || "default",
    input.gameType.trim(),
  );
  const take = Math.min(Math.max(input.limit ?? 10, 1), 50);
  const rows = await prisma.gameScore.findMany({
    where: { gameKey },
    orderBy: [{ bestScore: "desc" }, { updatedAt: "asc" }],
    take,
    include: { student: { select: { playerId: true, name: true } } },
  });
  return rows.map((r, i) => ({
    rank: i + 1,
    playerId: r.student.playerId,
    name: r.student.name,
    bestScore: r.bestScore,
  }));
}

export async function getMonthlyTop(input: {
  bookType: string;
  year?: number;
  month?: number;
  limit?: number;
}) {
  const now = getVietnamYearMonth();
  const year = input.year ?? now.year;
  const month = input.month ?? now.month;
  const take = Math.min(Math.max(input.limit ?? 20, 1), 100);

  const rows = await prisma.monthlyGameScore.groupBy({
    by: ["studentId"],
    where: { bookType: input.bookType, year, month },
    _sum: { bestScore: true },
    orderBy: { _sum: { bestScore: "desc" } },
    take,
  });

  const students = await prisma.student.findMany({
    where: { id: { in: rows.map((r) => r.studentId) } },
    select: { id: true, playerId: true, name: true },
  });
  const map = new Map(students.map((s) => [s.id, s]));

  return rows.map((r, i) => ({
    rank: i + 1,
    playerId: map.get(r.studentId)?.playerId ?? "",
    name: map.get(r.studentId)?.name ?? "",
    bestScore: r._sum.bestScore ?? 0,
    year,
    month,
  }));
}
