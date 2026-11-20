import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { setUserRoles } from "@/server/users";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  roleIds: z.array(z.string().min(1)).max(20),
});

export async function PUT(req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const { roleIds } = schema.parse(await req.json());
    const user = await setUserRoles(id, roleIds);
    return jsonOk(user);
  } catch (err) {
    return handleRouteError(err);
  }
}
