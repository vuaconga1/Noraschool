import { prisma } from "@/lib/prisma";

type IncompleteItem = {
  assignmentId: string;
  classId: string;
  className: string;
  bookType: string;
  unitSlug: string;
  partId: string;
  gameTypes: string[];
  bookName: string;
  unitName: string;
  partTitle: string | null;
  deadlineAt: string;
  completedGames: string[];
  remainingGames: string[];
  isComplete: boolean;
};

async function incompleteForUser(userId: string): Promise<IncompleteItem[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true },
  });
  if (!user?.username) return [];

  const memberships = await prisma.classMember.findMany({
    where: { userId },
    include: {
      classroom: {
        include: {
          assignments: true,
        },
      },
    },
  });

  const playerId = user.username;
  const now = new Date();
  const items: IncompleteItem[] = [];

  for (const m of memberships) {
    for (const a of m.classroom.assignments) {
      if (a.deadlineAt < now) continue;
      const attempts = await prisma.gameAttempt.findMany({
        where: {
          playerId: { equals: playerId, mode: "insensitive" },
          unitSlug: a.unitSlug,
          partId: a.partId,
          createdAt: { gte: a.createdAt },
        },
        select: { gameType: true },
      });
      const done = new Set(attempts.map((x) => x.gameType));
      const remaining = a.gameTypes.filter((g) => !done.has(g));
      items.push({
        assignmentId: a.id,
        classId: m.classroom.id,
        className: m.classroom.name,
        bookType: a.bookType,
        unitSlug: a.unitSlug,
        partId: a.partId,
        gameTypes: a.gameTypes,
        bookName: a.bookName,
        unitName: a.unitName,
        partTitle: a.partTitle,
        deadlineAt: a.deadlineAt.toISOString(),
        completedGames: a.gameTypes.filter((g) => done.has(g)),
        remainingGames: remaining,
        isComplete: remaining.length === 0,
      });
    }
  }

  return items.filter((i) => !i.isComplete);
}

export async function incompleteHomeworkForSessionUser(userId: string) {
  const items = await incompleteForUser(userId);
  return { items, count: items.length };
}

export async function incompleteHomeworkByPlayer(playerId: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: playerId, mode: "insensitive" } },
        { email: { equals: playerId, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  if (!user) return { items: [], count: 0 };
  return incompleteHomeworkForSessionUser(user.id);
}
