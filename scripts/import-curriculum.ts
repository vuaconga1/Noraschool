/**
 * Import curriculum from data/curriculum/chu-de-giao-vien.xlsx
 * Match vocab words to existing image/audio assets under public/, anh_wewin/, audio_wewin/.
 *
 *   npm run import:curriculum
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { canUsePrisma } from "../src/lib/db";
import { prisma } from "../src/lib/prisma";

const ROOT = path.resolve(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "data/curriculum/chu-de-giao-vien.xlsx");
const ASSET_DIRS = [
  path.join(ROOT, "public"),
  path.join(ROOT, "frontend/public"),
  path.join(ROOT, "anh_wewin"),
  path.join(ROOT, "audio_wewin"),
];

function normalizeWord(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/^review\s*:?\s*/i, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function parseWordList(cell: unknown): { words: string[]; isReview: boolean } {
  if (cell == null) return { words: [], isReview: false };
  const text = String(cell).replace(/\r/g, "\n");
  const isReview = /^\s*review\s*:/i.test(text) || /\breview\b/i.test(text.split("\n")[0] || "");
  // Drop leading "Label: " before first comma/list
  const cleaned = text.replace(/^[^:\n]{0,40}:\s*/m, "");
  const parts = cleaned
    .split(/[,\n;/|]+/)
    .map((p) => p.replace(/^review\s*:?\s*/i, "").trim())
    .filter(Boolean);
  const words: string[] = [];
  for (const p of parts) {
    const n = normalizeWord(p);
    if (n && n.length <= 60) words.push(n);
  }
  return { words: [...new Set(words)], isReview };
}

function walkFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

function buildAssetIndex() {
  const images = new Map<string, string>();
  const audios = new Map<string, string>();
  const imageExt = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);
  const audioExt = new Set([".mp3", ".wav", ".ogg", ".m4a"]);

  for (const dir of ASSET_DIRS) {
    for (const file of walkFiles(dir)) {
      const ext = path.extname(file).toLowerCase();
      const stem = normalizeWord(path.basename(file, ext));
      if (!stem) continue;
      let rel = file;
      if (file.startsWith(path.join(ROOT, "public"))) {
        rel = "/" + path.relative(path.join(ROOT, "public"), file).replace(/\\/g, "/");
      } else if (file.startsWith(path.join(ROOT, "frontend/public"))) {
        rel = "/" + path.relative(path.join(ROOT, "frontend/public"), file).replace(/\\/g, "/");
      } else {
        // Keep absolute-ish repo-relative path for unmatched local folders
        rel = "/" + path.relative(ROOT, file).replace(/\\/g, "/");
      }
      if (imageExt.has(ext) && !images.has(stem)) images.set(stem, rel);
      if (audioExt.has(ext) && !audios.has(stem)) audios.set(stem, rel);
    }
  }
  return { images, audios };
}

async function main() {
  if (!(await canUsePrisma())) {
    console.error("DATABASE_URL chưa sẵn sàng.");
    process.exit(1);
  }
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`Missing Excel: ${XLSX_PATH}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(XLSX_PATH);
  const sheetName =
    wb.SheetNames.find((n) => /chủ đề|chu de|2026/i.test(n)) ?? wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(
    wb.Sheets[sheetName],
    { header: 1, defval: null },
  ) as unknown[][];

  const { images, audios } = buildAssetIndex();
  console.log(
    `Asset index: ${images.size} images, ${audios.size} audios (sheet=${sheetName})`,
  );

  const unmatched = new Set<string>();
  let monthCount = 0;
  let wordCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;
    const monthRaw = row[0];
    const titleVi = String(row[1] ?? "").trim();
    const titleEn = String(row[2] ?? "").trim();
    if (!titleVi && !titleEn) continue;

    let monthDate: Date;
    if (monthRaw instanceof Date) monthDate = monthRaw;
    else if (typeof monthRaw === "number") {
      // Excel serial date
      const parsed = XLSX.SSF.parse_date_code(monthRaw);
      monthDate = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    } else {
      monthDate = new Date(String(monthRaw));
    }
    if (Number.isNaN(monthDate.getTime())) continue;

    const notes = row[3] != null ? String(row[3]) : null;
    const topicPlan = row[4] != null ? String(row[4]) : null;

    const month = await prisma.curriculumMonth.upsert({
      where: { monthDate },
      create: {
        monthDate,
        titleVi: titleVi || titleEn || "Untitled",
        titleEn: titleEn || titleVi || "Untitled",
        notes,
        topicPlan,
        sortOrder: i,
      },
      update: {
        titleVi: titleVi || titleEn || "Untitled",
        titleEn: titleEn || titleVi || "Untitled",
        notes,
        topicPlan,
        sortOrder: i,
      },
    });
    monthCount += 1;

    for (let w = 1; w <= 4; w++) {
      const cell = row[4 + w]; // cols F-I (index 5-8) after TOPIC at index 4
      // Header: 0 THÁNG, 1 CHỦ ĐỀ, 2 TOPIC, 3 GHI CHÚ, 4 TOPIC plan, 5 WEEK1...
      const weekCell = row[4 + w];
      const { words, isReview } = parseWordList(weekCell ?? cell);
      const rawText = weekCell != null ? String(weekCell) : null;

      const week = await prisma.curriculumWeek.upsert({
        where: {
          monthId_weekIndex: { monthId: month.id, weekIndex: w },
        },
        create: {
          monthId: month.id,
          weekIndex: w,
          label: rawText?.split("\n")[0]?.slice(0, 120) ?? `Week ${w}`,
          isReview,
          rawText,
        },
        update: {
          label: rawText?.split("\n")[0]?.slice(0, 120) ?? `Week ${w}`,
          isReview,
          rawText,
        },
      });

      await prisma.curriculumWeekWord.deleteMany({ where: { weekId: week.id } });

      let order = 0;
      for (const word of words) {
        const vocab = await prisma.vocabItem.upsert({
          where: { normalized: word },
          create: { word, normalized: word },
          update: {},
        });
        await prisma.curriculumWeekWord.create({
          data: {
            weekId: week.id,
            vocabItemId: vocab.id,
            sortOrder: order++,
          },
        });
        wordCount += 1;

        const imagePath = images.get(word) ?? null;
        const audioPath = audios.get(word) ?? null;
        if (!imagePath && !audioPath) unmatched.add(word);

        await prisma.vocabAsset.upsert({
          where: { vocabItemId: vocab.id },
          create: {
            vocabItemId: vocab.id,
            imagePath,
            audioPath,
          },
          update: {
            ...(imagePath ? { imagePath } : {}),
            ...(audioPath ? { audioPath } : {}),
          },
        });
      }
    }
  }

  const reportPath = path.join(ROOT, "data/curriculum/unmatched-words.txt");
  fs.writeFileSync(
    reportPath,
    [...unmatched].sort().join("\n") + "\n",
    "utf8",
  );

  console.log(
    `Imported months=${monthCount}, week-words=${wordCount}, unmatched=${unmatched.size}`,
  );
  console.log(`Unmatched report: ${reportPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
