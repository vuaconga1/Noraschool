/**
 * Seed default admin + base roles.
 *
 *   npm run seed:admin
 */

import "dotenv/config";
import { hashPassword } from "../src/lib/auth";
import { canUsePrisma } from "../src/lib/db";
import { prisma } from "../src/lib/prisma";

async function main() {
  if (!(await canUsePrisma())) {
    console.error("DATABASE_URL chưa sẵn sàng. Set Neon URL rồi chạy lại.");
    process.exit(1);
  }

  const email = (process.env.ADMIN_EMAIL ?? "admin@wewin.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "change-me";
  const username = process.env.ADMIN_USERNAME ?? "admin";

  if (password === "change-me") {
    console.warn(
      "⚠ Using default password 'change-me' — set ADMIN_PASSWORD before production.",
    );
  }

  const roleNames = ["ADMIN", "TEACHER", "STUDENT"];
  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: "ADMIN" },
  });
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      username,
      name: "Admin",
      passwordHash,
      legacyRole: 1,
      roles: { connect: [{ id: adminRole.id }] },
    },
    update: {
      passwordHash,
      username,
      legacyRole: 1,
      roles: { set: [{ id: adminRole.id }] },
    },
  });

  console.log(
    `Admin ready: ${user.email} / ${username} (id=${user.id})`,
  );
  console.log("Login at /login");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
