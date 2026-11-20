"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Legacy / mistaken URLs like `/games/themes/2026-09/2026-09-w1`
 * redirect to the real week route `/games/themes/2026-09/week/1`.
 */
export default function ThemeUnitSlugRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.slug ?? "");
  const unitSlug = String(params.unitSlug ?? "");

  useEffect(() => {
    if (!slug) {
      router.replace("/games");
      return;
    }

    const match = unitSlug.match(new RegExp(`^${slug}-w(\\d+)$`, "i"));
    if (match) {
      router.replace(`/games/themes/${slug}/week/${match[1]}`);
      return;
    }

    router.replace(`/games/themes/${slug}`);
  }, [slug, unitSlug, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-slate-600">
      Đang chuyển hướng…
    </div>
  );
}
