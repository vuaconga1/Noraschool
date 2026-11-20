import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { canUsePrisma } from "@/lib/db";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { deleteGame, getGameBySlug, updateGame } from "@/server/games";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    // Support both slug and id for management clients
    const bySlug = await getGameBySlug(slug);
    if (bySlug) return jsonOk(bySlug);
    if (await canUsePrisma()) {
      try {
        const byId = await prisma.gameUnit.findUnique({ where: { id: slug } });
        if (byId) return jsonOk(byId);
      } catch (err) {
        console.error("[GET /api/games/[slug]] prisma id lookup failed", err);
      }
    }
    return jsonError("NOT_FOUND", "Game không tồn tại", 404);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { slug: id } = await ctx.params;
    const body = z.record(z.string(), z.unknown()).parse(await req.json());
    return jsonOk(await updateGame(id, body as never));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireStaff();
    const { slug: id } = await ctx.params;
    return jsonOk(await deleteGame(id));
  } catch (err) {
    return handleRouteError(err);
  }
}
