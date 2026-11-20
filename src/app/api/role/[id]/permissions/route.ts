import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  permissionIds: z.array(z.string()).max(100),
});

export async function PUT(req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const { permissionIds } = schema.parse(await req.json());
    const role = await prisma.role.update({
      where: { id },
      data: { permissions: { set: permissionIds.map((pid) => ({ id: pid })) } },
      include: { permissions: true },
    });
    return jsonOk(role);
  } catch (err) {
    return handleRouteError(err);
  }
}
