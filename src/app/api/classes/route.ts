import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { createClass, listClasses } from "@/server/classes";

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  code: z.string().trim().max(40).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
});

export async function GET(req: Request) {
  try {
    await requireStaff();
    const sp = new URL(req.url).searchParams;
    return jsonOk(
      await listClasses({
        page: sp.get("page") ? Number(sp.get("page")) : undefined,
        limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
        q: sp.get("q") ?? undefined,
      }),
    );
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireStaff();
    const body = createSchema.parse(await req.json());
    return jsonOk(await createClass(actor, body), { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
