import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { addMembers } from "@/server/classes";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const actor = await requireStaff();
    const { id } = await ctx.params;
    const body = z
      .object({ userIds: z.array(z.string().min(1)).min(1).max(100) })
      .parse(await req.json());
    return jsonOk(await addMembers(actor, id, body.userIds));
  } catch (err) {
    return handleRouteError(err);
  }
}
