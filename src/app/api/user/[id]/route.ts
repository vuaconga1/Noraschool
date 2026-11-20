import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { userUpdateSchema } from "@/lib/validation/auth";
import { deleteUser, getUser, updateUser } from "@/server/users";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const user = await getUser(id);
    if (!user) return jsonError("NOT_FOUND", "Không tìm thấy user", 404);
    return jsonOk(user);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const body = userUpdateSchema.parse(await req.json());
    const user = await updateUser(id, body);
    return jsonOk(user);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    await deleteUser(id);
    return jsonOk({ message: "Deleted" });
  } catch (err) {
    return handleRouteError(err);
  }
}
