import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

/** List vocab assets (Gemini generate deferred — assets from import matcher). */
export async function GET() {
  try {
    await requireStaff();
    const items = await prisma.vocabAsset.findMany({
      include: {
        vocabItem: { select: { id: true, word: true, normalized: true } },
      },
      take: 2000,
      orderBy: { matchedAt: "desc" },
    });
    return jsonOk(
      items.map((a) => ({
        word: a.vocabItem.word,
        normalized: a.vocabItem.normalized,
        imagePath: a.imagePath,
        audioPath: a.audioPath,
        status: a.imagePath ? "ready" : "missing",
      })),
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
