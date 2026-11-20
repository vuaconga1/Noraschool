import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  isDisabled: z.boolean().optional(),
});

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
    return jsonOk(role);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const body = updateSchema.parse(await req.json());
    const role = await prisma.role.update({
      where: { id },
      data: body,
      include: { permissions: true },
    });
    return jsonOk(role);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    await prisma.role.delete({ where: { id } });
    return jsonOk({ message: "Deleted" });
  } catch (err) {
    return handleRouteError(err);
  }
}
