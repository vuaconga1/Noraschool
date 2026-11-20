import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ClassDetailClient } from "@/app/components/class-management/class-detail-client";
import { isStaffSession } from "@/app/components/class-management/staff";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!isStaffSession(session)) redirect("/");

  const { id } = await params;
  return <ClassDetailClient classId={id} />;
}
