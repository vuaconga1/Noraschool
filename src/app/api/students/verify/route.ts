import { z } from "zod";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { verifyStudent } from "@/server/students";

const schema = z.object({
  playerId: z.string().trim().min(1).max(50),
});

export async function POST(req: Request) {
  try {
    const { playerId } = schema.parse(await req.json());
    const student = await verifyStudent(playerId);
    if (!student) {
      return jsonError("NOT_FOUND", "ID người chơi không hợp lệ", 404);
    }
    return jsonOk(student);
  } catch (err) {
    return handleRouteError(err);
  }
}
