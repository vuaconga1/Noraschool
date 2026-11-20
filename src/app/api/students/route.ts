import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { createStudent, listStudents } from "@/server/students";

const createSchema = z.object({
  playerId: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(120),
});

export async function GET() {
  try {
    await requireStaff();
    return jsonOk(await listStudents());
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireStaff();
    const body = createSchema.parse(await req.json());
    return jsonOk(await createStudent(body.playerId, body.name), { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
