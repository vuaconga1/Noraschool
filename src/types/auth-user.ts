import type { Role } from "./role";

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  username?: string | null;
  roles: Role[];
  role?: number;
  image?: string | null;
}
