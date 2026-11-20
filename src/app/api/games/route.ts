import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { createGame, listGames } from "@/server/games";

const createSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(200),
  unit: z.string().trim().min(1).max(80),
  bookname: z.string().trim().min(1).max(120),
  bookType: z.string().trim().min(1).max(40).default("kids"),
  backgroundColor: z.string().optional().nullable(),
  flashcards: z.unknown(),
  wordOrdering: z.unknown().optional().nullable(),
  wordScramble: z.unknown().optional().nullable(),
  parts: z.unknown().optional().nullable(),
  enabledGames: z.array(z.string()).default([]),
  useRotatingGame: z.boolean().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookType = searchParams.get("bookType") ?? undefined;
    return jsonOk(await listGames(bookType || undefined));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireStaff();
    const body = createSchema.parse(await req.json());
    const game = await createGame({
      slug: body.slug,
      name: body.name,
      unit: body.unit,
      bookname: body.bookname,
      bookType: body.bookType,
      backgroundColor: body.backgroundColor ?? null,
      flashcards: body.flashcards as object,
      wordOrdering: (body.wordOrdering as object) ?? undefined,
      wordScramble: (body.wordScramble as object) ?? undefined,
      parts: (body.parts as object) ?? undefined,
      enabledGames: body.enabledGames,
      useRotatingGame: body.useRotatingGame ?? undefined,
    });
    return jsonOk(game, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
