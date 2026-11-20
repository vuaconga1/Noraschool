import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const playerId = sp.get("playerId")?.trim();
    const unitSlug = sp.get("unitSlug")?.trim();
    if (!playerId) {
      return jsonOk([]);
    }
    const rows = await prisma.gameProgress.findMany({
      where: {
        playerId,
        ...(unitSlug ? { unitSlug } : {}),
      },
    });
    return jsonOk(rows);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const playerId = sp.get("playerId")?.trim();
    const unitSlug = sp.get("unitSlug")?.trim();
    const partId = sp.get("partId")?.trim() || "default";
    if (!playerId || !unitSlug) {
      return jsonOk({ message: "ok" });
    }
    await prisma.gameProgress.deleteMany({
      where: { playerId, unitSlug, partId },
    });
    return jsonOk({ message: "Deleted" });
  } catch (err) {
    return handleRouteError(err);
  }
}
