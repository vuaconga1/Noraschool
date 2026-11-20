import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { getMonthlyTop } from "@/server/leaderboard";

export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const bookType = sp.get("bookType");
    if (!bookType) {
      return jsonError("VALIDATION_ERROR", "bookType là bắt buộc", 400);
    }
    return jsonOk(
      await getMonthlyTop({
        bookType,
        year: sp.get("year") ? Number(sp.get("year")) : undefined,
        month: sp.get("month") ? Number(sp.get("month")) : undefined,
        limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
      }),
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
