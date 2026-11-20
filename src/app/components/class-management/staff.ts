import { ROLES } from "@/lib/constants/roles";

type RoleLike = {
  name?: string;
  isDisabled?: boolean;
};

type UserLike = {
  roles?: RoleLike[];
  legacyRole?: number;
} | null | undefined;

export function isStaffSession(user: UserLike) {
  if (!user) return false;
  if (user.legacyRole === 1) return true;
  return !!user.roles?.some(
    (role) =>
      (role.name === ROLES.TEACHER || role.name === ROLES.ADMIN) &&
      role.isDisabled !== true,
  );
}
