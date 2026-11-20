import { redirect } from "next/navigation";
import { getSessionUser, isStaff } from "@/lib/auth";
import { VocabImagesReviewClient } from "@/app/components/vocabulary/vocab-images-review-client";

export default async function VocabImagesReviewPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!isStaff(session)) redirect("/");

  return <VocabImagesReviewClient />;
}
