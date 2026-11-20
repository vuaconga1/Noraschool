import { prisma } from "@/lib/prisma";
import {
  createSession,
  mapUserToSession,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validation/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password } = loginSchema.parse(body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      },
      include: { roles: { include: { permissions: true } } },
    });

    if (!user?.passwordHash) {
      return jsonError("INVALID_CREDENTIALS", "Sai tên đăng nhập/email hoặc mật khẩu", 401);
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return jsonError("INVALID_CREDENTIALS", "Sai tên đăng nhập/email hoặc mật khẩu", 401);
    }

    const session = mapUserToSession(user);
    await createSession(session);

    return jsonOk({
      message: "Đăng nhập thành công",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.legacyRole,
        roles: session.roles,
        image: user.image,
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
