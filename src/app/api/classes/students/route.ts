import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { searchClassStudents } from "@/server/classes";

export async function GET(req: Request) {
  try {
    await requireStaff();
    const q = new URL(req.url).searchParams.get("q") ?? undefined;
    return jsonOk(await searchClassStudents(q));
  } catch (err) {
    return handleRouteError(err);
  }
}
