import { requireUser } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { incompleteHomeworkForSessionUser } from "@/server/homework";

export async function GET() {
  try {
    const user = await requireUser();
    return jsonOk(await incompleteHomeworkForSessionUser(user.id));
  } catch (err) {
    return handleRouteError(err);
  }
}
