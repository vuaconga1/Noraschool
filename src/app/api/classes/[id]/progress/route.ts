import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { getClassProgress } from "@/server/classes";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    return jsonOk(await getClassProgress(id));
  } catch (err) {
    return handleRouteError(err);
  }
}
