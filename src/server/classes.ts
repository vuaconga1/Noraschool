import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";

const PAGE_SIZE = 20;

const BOOK_LABELS: Record<string, string> = {
  "super-kids": "Nora Super Kids",
  kids: "Kids",
  starter: "Starters",
  mover: "Movers",
  flyer: "Flyers",
};

async function audit(
  actor: SessionUser,
  action: string,
  classId: string | null,
  detail: Record<string, unknown>,
  assignmentId: string | null = null,
) {
  await prisma.classAuditLog.create({
    data: {
      action,
      actorId: actor.id,
      actorName: actor.name,
      classId,
      assignmentId,
      detail: detail as object,
    },
  });
}

export async function listClasses(input: {
  page?: number;
  limit?: number;
  q?: string;
}) {
  const page = input.page ?? 1;
  const limit = Math.min(input.limit ?? PAGE_SIZE, 100);
  const where = input.q?.trim()
    ? {
        OR: [
          { name: { contains: input.q.trim(), mode: "insensitive" as const } },
          { code: { contains: input.q.trim(), mode: "insensitive" as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.classroom.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { members: true, assignments: true } },
      },
    }),
    prisma.classroom.count({ where }),
  ]);

  return {
    items: items.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      source: c.source,
      memberCount: c._count.members,
      assignmentCount: c._count.assignments,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    total,
    page,
    limit,
  };
}

export async function createClass(
  actor: SessionUser,
  input: { name: string; code?: string | null; description?: string | null },
) {
  const cls = await prisma.classroom.create({
    data: {
      name: input.name.trim(),
      code: input.code?.trim() || null,
      description: input.description?.trim() || null,
      source: "manual",
      createdById: actor.id,
    },
  });
  await audit(actor, "create_class", cls.id, { name: cls.name, code: cls.code });
  return cls;
}

export async function updateClass(
  actor: SessionUser,
  id: string,
  input: { name?: string; code?: string | null; description?: string | null },
) {
  const cls = await prisma.classroom.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.code !== undefined ? { code: input.code?.trim() || null } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
    },
  });
  await audit(actor, "update_class", id, input as Record<string, unknown>);
  return cls;
}

export async function deleteClass(actor: SessionUser, id: string) {
  await prisma.classroom.delete({ where: { id } });
  await audit(actor, "delete_class", id, {});
  return { message: "Deleted" };
}

export async function getClassDetail(id: string) {
  const cls = await prisma.classroom.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
            },
          },
        },
        orderBy: { addedAt: "asc" },
      },
      assignments: { orderBy: { deadlineAt: "asc" } },
    },
  });
  if (!cls) throw new Error("NOT_FOUND");
  return cls;
}

export async function searchClassStudents(q?: string) {
  const where = q?.trim()
    ? {
        OR: [
          { name: { contains: q.trim(), mode: "insensitive" as const } },
          { email: { contains: q.trim(), mode: "insensitive" as const } },
          { username: { contains: q.trim(), mode: "insensitive" as const } },
        ],
      }
    : {};
  return prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, username: true },
    take: 50,
    orderBy: { name: "asc" },
  });
}

export async function addMembers(
  actor: SessionUser,
  classId: string,
  userIds: string[],
) {
  let added = 0;
  for (const userId of userIds) {
    try {
      await prisma.classMember.create({ data: { classId, userId } });
      added += 1;
    } catch {
      // unique violation — skip
    }
  }
  await audit(actor, "add_members", classId, { userIds, added });
  return { added };
}

export async function removeMember(
  actor: SessionUser,
  classId: string,
  userId: string,
) {
  await prisma.classMember.deleteMany({ where: { classId, userId } });
  await audit(actor, "remove_member", classId, { userId });
  return { message: "Removed" };
}

export async function getCatalog() {
  const units = await prisma.gameUnit.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      unit: true,
      bookname: true,
      bookType: true,
      parts: true,
      enabledGames: true,
    },
    orderBy: [{ bookType: "asc" }, { unit: "asc" }],
  });

  const byBook: Record<
    string,
    { bookType: string; label: string; units: typeof units }
  > = {};
  for (const u of units) {
    if (!byBook[u.bookType]) {
      byBook[u.bookType] = {
        bookType: u.bookType,
        label: BOOK_LABELS[u.bookType] ?? u.bookType,
        units: [],
      };
    }
    byBook[u.bookType].units.push(u);
  }
  return { books: Object.values(byBook) };
}

export async function createAssignments(
  actor: SessionUser,
  classId: string,
  items: Array<{
    bookType: string;
    unitSlug: string;
    partId: string;
    gameTypes: string[];
    bookName: string;
    unitName: string;
    partTitle?: string | null;
    deadlineAt: string;
  }>,
) {
  const created = await prisma.$transaction(
    items.map((item) =>
      prisma.classAssignment.create({
        data: {
          classId,
          bookType: item.bookType,
          unitSlug: item.unitSlug,
          partId: item.partId,
          gameTypes: item.gameTypes,
          bookName: item.bookName,
          unitName: item.unitName,
          partTitle: item.partTitle ?? null,
          deadlineAt: new Date(item.deadlineAt),
          createdById: actor.id,
        },
      }),
    ),
  );
  for (const a of created) {
    await audit(actor, "assign", classId, { assignmentId: a.id }, a.id);
  }
  return created;
}

export async function updateAssignment(
  actor: SessionUser,
  classId: string,
  assignmentId: string,
  input: { deadlineAt?: string; gameTypes?: string[] },
) {
  const updated = await prisma.classAssignment.update({
    where: { id: assignmentId },
    data: {
      ...(input.deadlineAt ? { deadlineAt: new Date(input.deadlineAt) } : {}),
      ...(input.gameTypes ? { gameTypes: input.gameTypes } : {}),
    },
  });
  await audit(
    actor,
    "update_deadline",
    classId,
    input as Record<string, unknown>,
    assignmentId,
  );
  return updated;
}

export async function deleteAssignment(
  actor: SessionUser,
  classId: string,
  assignmentId: string,
) {
  await prisma.classAssignment.delete({ where: { id: assignmentId } });
  await audit(actor, "delete_assignment", classId, {}, assignmentId);
  return { message: "Deleted" };
}

export async function listAuditLogs(classId?: string) {
  return prisma.classAuditLog.findMany({
    where: classId ? { classId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getClassProgress(classId: string) {
  const cls = await getClassDetail(classId);
  const usernames = cls.members
    .map((m) => m.user.username)
    .filter((u): u is string => Boolean(u));

  const students = usernames.length
    ? await prisma.student.findMany({
        where: { playerId: { in: usernames } },
        select: { id: true, playerId: true, name: true },
      })
    : [];

  const studentIds = students.map((s) => s.id);
  const assignmentKeys = cls.assignments.flatMap((a) =>
    a.gameTypes.map((gt) => `${a.unitSlug}:${a.partId}:${gt}`),
  );

  const scores = studentIds.length
    ? await prisma.gameScore.findMany({
        where: {
          studentId: { in: studentIds },
          gameKey: { in: assignmentKeys },
        },
      })
    : [];

  return {
    classId,
    members: cls.members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      username: m.user.username,
      playerId: m.user.username,
    })),
    assignments: cls.assignments,
    scores,
    students,
  };
}
