import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { getCatalog } from "@/server/classes";

export async function GET() {
  try {
    await requireStaff();
    return jsonOk(await getCatalog());
  } catch (err) {
    return handleRouteError(err);
  }
}
