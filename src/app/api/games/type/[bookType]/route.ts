import { handleRouteError, jsonOk } from "@/lib/http";
import { listGamesByType } from "@/server/games";

type Ctx = { params: Promise<{ bookType: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { bookType } = await ctx.params;
    return jsonOk(await listGamesByType(bookType));
  } catch (err) {
    return handleRouteError(err);
  }
}
