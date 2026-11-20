import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      image: true,
      legacyRole: true,
      createdAt: true,
      roles: {
        select: {
          id: true,
          name: true,
          isDisabled: true,
          permissions: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function getUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      roles: { include: { permissions: true } },
    },
  });
}

export async function createUser(input: {
  name: string;
  email?: string | null;
  username?: string | null;
  password?: string | null;
  phone?: string | null;
  address?: string | null;
  legacyRole?: number;
  roleIds?: string[];
}) {
  const passwordHash = input.password
    ? await hashPassword(input.password)
    : null;

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email || null,
      username: input.username || null,
      passwordHash,
      phone: input.phone || null,
      address: input.address || null,
      legacyRole: input.legacyRole ?? 0,
      roles: input.roleIds?.length
        ? { connect: input.roleIds.map((id) => ({ id })) }
        : undefined,
    },
    include: { roles: { include: { permissions: true } } },
  });
}

export async function updateUser(
  id: string,
  input: {
    name?: string;
    email?: string | null;
    username?: string | null;
    password?: string | null;
    phone?: string | null;
    address?: string | null;
    legacyRole?: number;
    roleIds?: string[];
  },
) {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.email !== undefined) data.email = input.email;
  if (input.username !== undefined) data.username = input.username;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.address !== undefined) data.address = input.address;
  if (input.legacyRole !== undefined) data.legacyRole = input.legacyRole;
  if (input.password) data.passwordHash = await hashPassword(input.password);

  return prisma.user.update({
    where: { id },
    data: {
      ...data,
      ...(input.roleIds
        ? { roles: { set: input.roleIds.map((rid) => ({ id: rid })) } }
        : {}),
    },
    include: { roles: { include: { permissions: true } } },
  });
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
  return { message: "Deleted" };
}

export async function setUserRoles(id: string, roleIds: string[]) {
  return prisma.user.update({
    where: { id },
    data: { roles: { set: roleIds.map((rid) => ({ id: rid })) } },
    include: { roles: { include: { permissions: true } } },
  });
}
