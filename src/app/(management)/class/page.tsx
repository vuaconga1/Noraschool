import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClassListClient } from "@/app/components/class-management/class-list-client";
import { isStaffSession } from "@/app/components/class-management/staff";

export default async function ClassPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!isStaffSession(session)) redirect("/");

  return <ClassListClient />;
}
