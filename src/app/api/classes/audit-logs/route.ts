import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { listAuditLogs } from "@/server/classes";

export async function GET(req: Request) {
  try {
    await requireStaff();
    const classId = new URL(req.url).searchParams.get("classId") ?? undefined;
    return jsonOk(await listAuditLogs(classId));
  } catch (err) {
    return handleRouteError(err);
  }
}
