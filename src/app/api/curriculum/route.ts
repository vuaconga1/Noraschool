import { requireStaff, getSessionUser } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Public read for resources; staff can always read
    const sp = new URL(req.url).searchParams;
    const monthId = sp.get("monthId") ?? undefined;

    if (monthId) {
      const month = await prisma.curriculumMonth.findUnique({
        where: { id: monthId },
        include: {
          weeks: {
            orderBy: { weekIndex: "asc" },
            include: {
              words: {
                orderBy: { sortOrder: "asc" },
                include: {
                  vocabItem: { include: { assets: true } },
                },
              },
            },
          },
        },
      });
      return jsonOk(month);
    }

    const months = await prisma.curriculumMonth.findMany({
      orderBy: { monthDate: "asc" },
      include: {
        weeks: {
          orderBy: { weekIndex: "asc" },
          include: {
            _count: { select: { words: true } },
          },
        },
      },
    });
    return jsonOk(months);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST() {
  try {
    await requireStaff();
    // Import is via script; this endpoint returns current counts for admin
    const user = await getSessionUser();
    const [months, words, assets] = await Promise.all([
      prisma.curriculumMonth.count(),
      prisma.vocabItem.count(),
      prisma.vocabAsset.count(),
    ]);
    return jsonOk({
      message: "Use npm run import:curriculum to load Excel",
      actor: user?.id,
      counts: { months, words, assets },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
