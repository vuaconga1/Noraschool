import { z } from "zod";
import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { ensureStudent } from "@/server/students";

const schema = z.object({
  playerId: z.string().trim().min(1).max(50),
  unitSlug: z.string().trim().min(1).max(80),
  partId: z.string().trim().max(40).optional(),
  bookname: z.string().trim().min(1).max(120),
  progress: z.record(z.string(), z.boolean()),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const partId = body.partId?.trim() || "default";
    const student = await ensureStudent(body.playerId);

    const row = await prisma.gameProgress.upsert({
      where: {
        playerId_unitSlug_partId: {
          playerId: body.playerId,
          unitSlug: body.unitSlug,
          partId,
        },
      },
      create: {
        playerId: body.playerId,
        unitSlug: body.unitSlug,
        partId,
        bookname: body.bookname,
        progress: body.progress,
        studentId: student.id,
      },
      update: {
        bookname: body.bookname,
        progress: body.progress,
        studentId: student.id,
      },
    });
    return jsonOk(row);
  } catch (err) {
    return handleRouteError(err);
  }
}
