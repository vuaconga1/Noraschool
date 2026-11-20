import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { deleteStudent, updateStudent } from "@/server/students";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    return jsonOk(await prisma.student.findUnique({ where: { id } }));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const body = z
      .object({
        name: z.string().trim().min(1).max(120).optional(),
        playerId: z.string().trim().min(1).max(50).optional(),
      })
      .parse(await req.json());
    return jsonOk(await updateStudent(id, body));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    return jsonOk(await deleteStudent(id));
  } catch (err) {
    return handleRouteError(err);
  }
}
