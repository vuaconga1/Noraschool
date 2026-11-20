import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  isDisabled: z.boolean().optional(),
  permissionIds: z.array(z.string()).max(100).optional(),
});

export async function GET() {
  try {
    await requireStaff();
    const roles = await prisma.role.findMany({
      include: { permissions: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });
    return jsonOk(roles);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireStaff();
    const body = createSchema.parse(await req.json());
    const role = await prisma.role.create({
      data: {
        name: body.name,
        isDisabled: body.isDisabled ?? false,
        permissions: body.permissionIds?.length
          ? { connect: body.permissionIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { permissions: true },
    });
    return jsonOk(role, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
