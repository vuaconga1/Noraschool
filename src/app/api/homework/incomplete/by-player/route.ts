import { z } from "zod";
import { handleRouteError, jsonOk } from "@/lib/http";
import { incompleteHomeworkByPlayer } from "@/server/homework";

export async function GET(req: Request) {
  try {
    const playerId = new URL(req.url).searchParams.get("playerId")?.trim();
    if (!playerId) return jsonOk({ items: [], count: 0 });
    return jsonOk(await incompleteHomeworkByPlayer(playerId));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    const body = z
      .object({ playerId: z.string().trim().min(1).max(50) })
      .parse(await req.json());
    return jsonOk(await incompleteHomeworkByPlayer(body.playerId));
  } catch (err) {
    return handleRouteError(err);
  }
}
