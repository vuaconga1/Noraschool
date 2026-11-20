import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  bookType: z.string().min(1).max(40),
  gameSlug: z.string().min(1).max(80),
  unit: z.string().min(1).max(80),
  unitTitle: z.string().min(1).max(200),
  sectionId: z.string().max(80).optional().nullable(),
  sectionTitle: z.string().max(200).optional().nullable(),
  wordId: z.string().min(1).max(80),
  word: z.string().min(1).max(120),
  emoji: z.string().max(20).optional().nullable(),
  meaning: z.string().max(500).optional().nullable(),
  link: z.string().max(500).optional().nullable(),
  audioUrl: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function GET(req: Request) {
  try {
    await requireStaff();
    const sp = new URL(req.url).searchParams;
    const bookType = sp.get("bookType") ?? undefined;
    const gameSlug = sp.get("gameSlug") ?? undefined;
    const items = await prisma.vocabularyItem.findMany({
      where: {
        ...(bookType ? { bookType } : {}),
        ...(gameSlug ? { gameSlug } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { word: "asc" }],
      take: 2000,
    });
    return jsonOk(items);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireStaff();
    const body = createSchema.parse(await req.json());
    const item = await prisma.vocabularyItem.create({ data: body });
    return jsonOk(item, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
