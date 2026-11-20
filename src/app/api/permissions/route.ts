import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export async function GET() {
  try {
    await requireStaff();
    const items = await prisma.permission.findMany({ orderBy: { name: "asc" } });
    return jsonOk(items);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireStaff();
    const body = createSchema.parse(await req.json());
    const item = await prisma.permission.create({ data: { name: body.name } });
    return jsonOk(item, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
