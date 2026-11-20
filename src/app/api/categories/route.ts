import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function GET() {
  try {
    await requireStaff();
    return jsonOk([]);
  } catch (err) {
    return handleRouteError(err);
  }
}
