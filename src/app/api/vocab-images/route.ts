import fs from "node:fs";
import path from "node:path";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export type VocabImageStatus = "none" | "pending" | "approved" | "rejected";

function wordFileStem(word: string): string {
  const cleaned = word
    .trim()
    .toLowerCase()
    .replace(/\s+chỉ\s+dành\s+cho\b.*$/u, "")
    .replace(/\s+\d+\s*-\s*\d+\s*yo\b.*$/u, "")
    .replace(/[-_]+/g, " ")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
  return cleaned.replace(/\s+/g, "-");
}

function publicUrlExists(relUrl: string): boolean {
  const relative = relUrl.replace(/^\/+/, "").replace(/\\/g, "/");
  const abs = path.join(process.cwd(), "public", relative);
  return fs.existsSync(abs);
}

function folderImage(
  folder: "approved" | "pending" | "rejected",
  stem: string,
): string | null {
  const rel = `/assets/vocab/${folder}/${stem}.png`;
  return publicUrlExists(rel) ? rel : null;
}

/** List all curriculum vocab images for admin review. */
export async function GET(req: Request) {
  try {
    await requireStaff();
    const { searchParams } = new URL(req.url);
    const statusFilter = (searchParams.get("status") || "all").toLowerCase();
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const items = await prisma.vocabItem.findMany({
      include: { assets: true },
      orderBy: { normalized: "asc" },
      take: 5000,
    });

    const mapped = items.map((v) => {
      const stem = wordFileStem(v.normalized || v.word);
      const approved = folderImage("approved", stem);
      const pending = folderImage("pending", stem);
      const rejected = folderImage("rejected", stem);
      const dbPath = v.assets?.imagePath?.trim() || null;
      const dbOk = dbPath
        ? dbPath.startsWith("http") || publicUrlExists(dbPath)
        : false;

      let status: VocabImageStatus = "none";
      let imageUrl: string | null = null;

      if (approved) {
        status = "approved";
        imageUrl = approved;
      } else if (pending) {
        status = "pending";
        imageUrl = pending;
      } else if (rejected) {
        status = "rejected";
        imageUrl = rejected;
      } else if (dbOk && dbPath) {
        status = "approved";
        imageUrl = dbPath;
      }

      return {
        word: v.word,
        slug: stem,
        meaning: v.meaning,
        imageUrl,
        imagePath: imageUrl,
        audioPath: v.assets?.audioPath ?? null,
        status,
        rejectedCount: 0,
        normalized: v.normalized,
      };
    });

    const filtered = mapped.filter((item) => {
      if (search) {
        const hay = `${item.word} ${item.normalized} ${item.meaning ?? ""}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      if (statusFilter && statusFilter !== "all") {
        if (statusFilter === "none") return item.status === "none";
        return item.status === statusFilter;
      }
      return true;
    });

    return jsonOk(filtered);
  } catch (err) {
    return handleRouteError(err);
  }
}
