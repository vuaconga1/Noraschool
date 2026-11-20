import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { getTop } from "@/server/leaderboard";

export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const unitSlug = sp.get("unitSlug");
    const gameType = sp.get("gameType");
    if (!unitSlug || !gameType) {
      return jsonError("VALIDATION_ERROR", "unitSlug và gameType là bắt buộc", 400);
    }
    const limit = sp.get("limit") ? Number(sp.get("limit")) : undefined;
    return jsonOk(
      await getTop({
        unitSlug,
        partId: sp.get("partId") ?? undefined,
        gameType,
        limit,
      }),
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
