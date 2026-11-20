import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    return jsonOk(await prisma.vocabularyItem.findUnique({ where: { id } }));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const body = z.record(z.string(), z.unknown()).parse(await req.json());
    return jsonOk(
      await prisma.vocabularyItem.update({ where: { id }, data: body as never }),
    );
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    await prisma.vocabularyItem.delete({ where: { id } });
    return jsonOk({ message: "Deleted" });
  } catch (err) {
    return handleRouteError(err);
  }
}
