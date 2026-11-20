import { z } from "zod";
import { handleRouteError, jsonOk } from "@/lib/http";
import { submitBestScore } from "@/server/leaderboard";

const schema = z.object({
  playerId: z.string().trim().min(1).max(50),
  playerName: z.string().trim().max(120).optional(),
  unitSlug: z.string().trim().min(1).max(80),
  partId: z.string().trim().max(40).optional(),
  gameType: z.string().trim().min(1).max(40),
  score: z.number().int().min(0).max(1_000_000),
  maxScore: z.number().int().min(0).max(1_000_000).optional(),
  itemCount: z.number().int().min(0).max(10_000).optional(),
  bookType: z.string().trim().max(40).optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    return jsonOk(await submitBestScore(body));
  } catch (err) {
    return handleRouteError(err);
  }
}
