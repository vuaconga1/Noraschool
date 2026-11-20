import { requireStaff } from "@/lib/auth";
import { handleRouteError } from "@/lib/http";
import { getClassProgress } from "@/server/classes";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const progress = await getClassProgress(id);
    const header = ["playerId", "name", "gameKey", "bestScore"];
    const lines = [header.join(",")];
    for (const s of progress.scores) {
      const student = progress.students.find((st) => st.id === s.studentId);
      lines.push(
        [
          student?.playerId ?? "",
          JSON.stringify(student?.name ?? ""),
          s.gameKey,
          String(s.bestScore),
        ].join(","),
      );
    }
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="class-${id}.csv"`,
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
