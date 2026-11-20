import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import {
  deleteClass,
  getClassDetail,
  updateClass,
} from "@/server/classes";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    return jsonOk(await getClassDetail(id));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const actor = await requireStaff();
    const { id } = await ctx.params;
    const body = z
      .object({
        name: z.string().trim().min(1).max(200).optional(),
        code: z.string().trim().max(40).optional().nullable(),
        description: z.string().trim().max(2000).optional().nullable(),
      })
      .parse(await req.json());
    return jsonOk(await updateClass(actor, id, body));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const actor = await requireStaff();
    const { id } = await ctx.params;
    return jsonOk(await deleteClass(actor, id));
  } catch (err) {
    return handleRouteError(err);
  }
}
