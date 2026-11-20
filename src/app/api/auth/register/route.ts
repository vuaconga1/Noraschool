import { prisma } from "@/lib/prisma";
import { hashPassword, mapUserToSession, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validation/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const body = registerSchema.parse(await req.json());
    const email = body.email;

    const existed = await prisma.user.findUnique({ where: { email } });
    if (existed) {
      return jsonError("EMAIL_EXISTS", "Email này đã được đăng ký", 400);
    }

    const name = body.name?.trim() || email.split("@")[0] || "Học viên";
    const passwordHash = await hashPassword(body.password);

    let studentRole = await prisma.role.findUnique({ where: { name: "STUDENT" } });
    if (!studentRole) {
      studentRole = await prisma.role.create({ data: { name: "STUDENT" } });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        legacyRole: 0,
        roles: { connect: [{ id: studentRole.id }] },
      },
      include: { roles: { include: { permissions: true } } },
    });

    const session = mapUserToSession(user);
    await createSession(session);

    return jsonOk({
      message: "Đăng ký thành công",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: session.roles,
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
