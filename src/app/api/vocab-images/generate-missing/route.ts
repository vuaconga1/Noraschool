import { requireStaff } from "@/lib/auth";
import { jsonOk } from "@/lib/http";

/** Deferred: Gemini + local FS not available on Vercel. Use import:curriculum. */
export async function POST() {
  await requireStaff();
  return jsonOk({
    generated: 0,
    message:
      "Vocab image generation deferred. Run npm run import:curriculum to match existing assets.",
  });
}
