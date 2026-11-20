import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { removeMember } from "@/server/classes";

type Ctx = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const actor = await requireStaff();
    const { id, userId } = await ctx.params;
    return jsonOk(await removeMember(actor, id, userId));
  } catch (err) {
    return handleRouteError(err);
  }
}
