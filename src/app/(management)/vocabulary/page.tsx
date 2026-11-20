import { redirect } from "next/navigation";
import { getSessionUser, isStaff } from "@/lib/auth";
import { VocabularyManagementClient } from "@/app/components/vocabulary/vocabulary-management-client";

export default async function VocabularyManagementPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!isStaff(session)) redirect("/");

  return <VocabularyManagementClient />;
}
