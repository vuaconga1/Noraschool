import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    return jsonOk(await prisma.permission.findUnique({ where: { id } }));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const body = z.object({ name: z.string().trim().min(1).max(120) }).parse(await req.json());
    return jsonOk(
      await prisma.permission.update({ where: { id }, data: { name: body.name } }),
    );
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    await prisma.permission.delete({ where: { id } });
    return jsonOk({ message: "Deleted" });
  } catch (err) {
    return handleRouteError(err);
  }
}
