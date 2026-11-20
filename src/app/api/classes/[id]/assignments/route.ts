import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { createAssignments } from "@/server/classes";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  items: z
    .array(
      z.object({
        bookType: z.string().min(1).max(40),
        unitSlug: z.string().min(1).max(80),
        partId: z.string().min(1).max(40),
        gameTypes: z.array(z.string()).min(1).max(20),
        bookName: z.string().min(1).max(120),
        unitName: z.string().min(1).max(200),
        partTitle: z.string().max(200).optional().nullable(),
        deadlineAt: z.string().min(1),
      }),
    )
    .min(1)
    .max(50),
});

export async function POST(req: Request, ctx: Ctx) {
  try {
    const actor = await requireStaff();
    const { id } = await ctx.params;
    const body = schema.parse(await req.json());
    return jsonOk(await createAssignments(actor, id, body.items), {
      status: 201,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
