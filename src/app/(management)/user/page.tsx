import { redirect } from "next/navigation";
import { getSessionUser, isStaff } from "@/lib/auth";
import { UserManagementClient } from "@/app/components/users/user-management-client";

export default async function UserManagementPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!isStaff(session)) redirect("/");

  return <UserManagementClient currentUserId={session.id} />;
}
