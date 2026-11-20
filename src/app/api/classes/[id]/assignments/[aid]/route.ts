import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { deleteAssignment, updateAssignment } from "@/server/classes";

type Ctx = { params: Promise<{ id: string; aid: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const actor = await requireStaff();
    const { id, aid } = await ctx.params;
    const body = z
      .object({
        deadlineAt: z.string().optional(),
        gameTypes: z.array(z.string()).max(20).optional(),
      })
      .parse(await req.json());
    return jsonOk(await updateAssignment(actor, id, aid, body));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const actor = await requireStaff();
    const { id, aid } = await ctx.params;
    return jsonOk(await deleteAssignment(actor, id, aid));
  } catch (err) {
    return handleRouteError(err);
  }
}
