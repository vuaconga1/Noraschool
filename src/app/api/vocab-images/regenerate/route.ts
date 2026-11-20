import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";

export async function POST(req: Request) {
  try {
    await requireStaff();
    z.object({ word: z.string().min(1) }).parse(await req.json());
    return jsonOk({
      ok: false,
      message: "Regenerate deferred — use local assets via import:curriculum",
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
