import { getSessionUser, loadSessionUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return jsonError("LOGIN_REQUIRED", "Cần đăng nhập", 401);
  }

  const fresh = (await loadSessionUser(session.id)) ?? session;
  return jsonOk({
    user: {
      id: fresh.id,
      name: fresh.name,
      email: fresh.email ?? undefined,
      username: fresh.username,
      role: fresh.legacyRole,
      roles: fresh.roles,
    },
  });
}
