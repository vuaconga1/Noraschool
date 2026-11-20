import { prisma } from "@/lib/prisma";

export async function verifyStudent(playerId: string) {
  const student = await prisma.student.findUnique({
    where: { playerId: playerId.trim() },
  });
  if (!student) return null;
  return { id: student.id, playerId: student.playerId, name: student.name };
}

export async function ensureStudent(playerId: string, name?: string) {
  const pid = playerId.trim();
  const existing = await prisma.student.findUnique({ where: { playerId: pid } });
  if (existing) return existing;
  return prisma.student.create({
    data: {
      playerId: pid,
      name: name?.trim() || pid,
    },
  });
}

export async function listStudents() {
  return prisma.student.findMany({
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
}

export async function createStudent(playerId: string, name: string) {
  return prisma.student.create({
    data: { playerId: playerId.trim(), name: name.trim() },
  });
}

export async function updateStudent(id: string, data: { name?: string; playerId?: string }) {
  return prisma.student.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.playerId !== undefined ? { playerId: data.playerId.trim() } : {}),
    },
  });
}

export async function deleteStudent(id: string) {
  await prisma.student.delete({ where: { id } });
  return { message: "Deleted" };
}
