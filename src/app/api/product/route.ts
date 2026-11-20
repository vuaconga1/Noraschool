import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";

/** Inventory module retired — empty stub for old UI. */
export async function GET() {
  try {
    await requireStaff();
    return jsonOk({ items: [], total: 0 });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST() {
  try {
    await requireStaff();
    return jsonOk({ message: "Inventory module not available in monolith v1" }, { status: 501 });
  } catch (err) {
    return handleRouteError(err);
  }
}
