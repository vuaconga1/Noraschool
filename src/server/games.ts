import { prisma } from "@/lib/prisma";
import { canUsePrisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { UnitGameConfig } from "@/types/games";
import { BOOK_CONFIG, getUnitBySlug } from "@/lib/constants/bookConfig";
import {
  MOVER_BOOK_CONFIG,
  getMoverUnitBySlug,
} from "@/lib/constants/moverBookConfig";
import {
  FLYER_BOOK_CONFIG,
  getFlyerUnitBySlug,
} from "@/lib/constants/flyerBookConfig";
import {
  STARTER_BOOK_CONFIG,
  getStarterUnitBySlug,
} from "@/lib/constants/starterBookConfig";

function normalizeBookType(bookType?: string): string {
  const t = (bookType || "").trim().toLowerCase();
  if (t === "starters" || t === "starter") return "starter";
  if (t === "movers" || t === "mover") return "mover";
  if (t === "flyers" || t === "flyer") return "flyer";
  if (t === "kids") return "kids";
  return t;
}

function staticUnitsForType(bookType: string): UnitGameConfig[] {
  switch (normalizeBookType(bookType)) {
    case "starter":
      return STARTER_BOOK_CONFIG;
    case "mover":
      return MOVER_BOOK_CONFIG;
    case "flyer":
      return FLYER_BOOK_CONFIG;
    case "kids":
      return BOOK_CONFIG;
    default:
      return [];
  }
}

function findStaticUnit(slug: string): UnitGameConfig | null {
  return (
    getStarterUnitBySlug(slug) ??
    getUnitBySlug(slug) ??
    getMoverUnitBySlug(slug) ??
    getFlyerUnitBySlug(slug) ??
    null
  );
}

function withBookType(
  unit: UnitGameConfig,
  bookType: string,
): UnitGameConfig & { bookType: string } {
  return {
    ...unit,
    bookType: unit.bookType || bookType,
  };
}

export async function listGames(bookType?: string) {
  if (await canUsePrisma()) {
    try {
      return await prisma.gameUnit.findMany({
        where: bookType ? { bookType } : undefined,
        select: {
          id: true,
          slug: true,
          name: true,
          unit: true,
          bookname: true,
          bookType: true,
          backgroundColor: true,
          enabledGames: true,
          useRotatingGame: true,
          updatedAt: true,
        },
        orderBy: [{ bookType: "asc" }, { unit: "asc" }],
      });
    } catch (err) {
      console.error("[listGames] prisma failed, using static fallback", err);
    }
  }

  const types = bookType
    ? [normalizeBookType(bookType)]
    : ["starter", "kids", "mover", "flyer"];
  return types.flatMap((type) =>
    staticUnitsForType(type).map((u, i) => ({
      id: `static-${type}-${u.slug}`,
      slug: u.slug,
      name: u.name,
      unit: u.unit,
      bookname: u.bookname,
      bookType: type,
      backgroundColor: u.backgroundColor ?? null,
      enabledGames: u.enabledGames ?? [],
      useRotatingGame: u.useRotatingGame ?? false,
      updatedAt: new Date(0),
      _staticIndex: i,
    })),
  );
}

export async function listGamesByType(bookType: string) {
  const normalized = normalizeBookType(bookType);
  if (await canUsePrisma()) {
    try {
      const rows = await prisma.gameUnit.findMany({
        where: {
          OR: [
            { bookType: normalized },
            { bookType },
            ...(normalized === "starter"
              ? [{ bookType: "starters" }]
              : normalized === "mover"
                ? [{ bookType: "movers" }]
                : normalized === "flyer"
                  ? [{ bookType: "flyers" }]
                  : []),
          ],
        },
        orderBy: { unit: "asc" },
      });
      if (rows.length > 0) return rows;
    } catch (err) {
      console.error(
        "[listGamesByType] prisma failed, using static fallback",
        err,
      );
    }
  }

  return staticUnitsForType(normalized).map((u) =>
    withBookType(u, normalized),
  );
}

export async function getGameBySlug(slug: string) {
  if (await canUsePrisma()) {
    try {
      const row = await prisma.gameUnit.findUnique({ where: { slug } });
      if (row) return row;
    } catch (err) {
      console.error("[getGameBySlug] prisma failed, using static fallback", err);
    }
  }

  const unit = findStaticUnit(slug);
  if (!unit) return null;

  const bookType =
    unit.bookType ||
    (getStarterUnitBySlug(slug)
      ? "starter"
      : getMoverUnitBySlug(slug)
        ? "mover"
        : getFlyerUnitBySlug(slug)
          ? "flyer"
          : "kids");

  return withBookType(unit, bookType);
}

export async function createGame(data: Prisma.GameUnitCreateInput) {
  return prisma.gameUnit.create({ data });
}

export async function updateGame(id: string, data: Prisma.GameUnitUpdateInput) {
  return prisma.gameUnit.update({ where: { id }, data });
}

export async function deleteGame(id: string) {
  await prisma.gameUnit.delete({ where: { id } });
  return { message: "Deleted" };
}
