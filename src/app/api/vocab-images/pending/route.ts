import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireStaff();
    const items = await prisma.vocabItem.findMany({
      where: {
        OR: [
          { assets: null },
          { assets: { imagePath: null } },
        ],
      },
      take: 500,
      select: { word: true, normalized: true, assets: true },
    });
    return jsonOk(
      items.map((v) => ({
        word: v.word,
        status: "pending",
        imagePath: v.assets?.imagePath ?? null,
      })),
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
