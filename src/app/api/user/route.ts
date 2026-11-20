import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { userCreateSchema } from "@/lib/validation/auth";
import { createUser, listUsers } from "@/server/users";

export async function GET() {
  try {
    await requireStaff();
    const users = await listUsers();
    return jsonOk(users);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireStaff();
    const body = userCreateSchema.parse(await req.json());
    const user = await createUser(body);
    return jsonOk(user, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
