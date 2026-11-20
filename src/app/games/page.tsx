import { redirect } from "next/navigation";
import { DEFAULT_THEME_SLUG } from "@/lib/curriculum-themes";

/** Library entry → first theme week-picker (sidebar + 4 weeks). */
export default function GamesPage() {
  redirect(`/games/themes/${DEFAULT_THEME_SLUG}`);
}
