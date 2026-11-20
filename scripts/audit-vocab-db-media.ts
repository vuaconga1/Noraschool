/**
 * Audit all vocab_items in DB: missing image, missing audio, wrong image mapping.
 * Writes data/curriculum/vocab-media-audit.md
 *
 *   npx tsx scripts/audit-vocab-db-media.ts
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { canUsePrisma } from "../src/lib/db";
import { prisma } from "../src/lib/prisma";

const ROOT = path.resolve(__dirname, "..");
const OUT_MD = path.join(ROOT, "data/curriculum/vocab-media-audit.md");
const OUT_JSON = path.join(ROOT, "data/curriculum/vocab-media-audit.json");

const ASSET_DIRS = [
  path.join(ROOT, "public"),
  path.join(ROOT, "frontend/public"),
  path.join(ROOT, "anh_wewin"),
  path.join(ROOT, "audio_wewin"),
];

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);
const AUDIO_EXT = new Set([".mp3", ".wav", ".ogg", ".m4a"]);

/** Known aliases: word normalized → acceptable image stems */
const IMAGE_ALIASES: Record<string, string[]> = {
  labybug: ["ladybug"],
  caterpilla: ["caterpillar"],
  televison: ["television"],
};

type AuditRow = {
  word: string;
  normalized: string;
  meaning: string | null;
  context: string;
  dbPath?: string | null;
  imageStem?: string;
  expectedStem?: string;
  diskCandidate?: string | null;
  diskAudioCandidate?: string | null;
};

function normalizeWord(raw: string): string {
  return String(raw ?? "")
    .normalize("NFKC")
    .replace(/^review\s*:?\s*/i, "")
    .replace(/chỉ dành cho level\s*\d*\s*[-–]?\s*\d*\s*yo?/gi, " ")
    .replace(/\(?\s*\d\s*[-–]\s*\d\s*yo\s*\)?/gi, " ")
    .replace(/level\s*\d\s*[-–]\s*\d\s*yo/gi, " ")
    .replace(/\bchỉ dành cho level\b/gi, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
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
  for (const dir of ASSET_DIRS) {
    for (const file of walkFiles(dir)) {
      const ext = path.extname(file).toLowerCase();
      const stem = normalizeWord(path.basename(file, ext));
      if (!stem) continue;
      if (IMAGE_EXT.has(ext) && !images.has(stem)) images.set(stem, file);
      if (AUDIO_EXT.has(ext) && !audios.has(stem)) audios.set(stem, file);
    }
  }
  return { images, audios };
}

function resolveLocalPath(urlOrPath: string | null | undefined): {
  kind: "remote" | "local" | "missing";
  path: string;
} | null {
  if (!urlOrPath) return null;
  const raw = String(urlOrPath).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) {
    return { kind: "remote", path: raw };
  }

  let relative = raw.replace(/\\/g, "/").replace(/^\/+/, "");
  try {
    relative = decodeURIComponent(relative);
  } catch {
    // keep encoded
  }

  const candidates = [
    path.join(ROOT, "public", relative),
    path.join(ROOT, "frontend/public", relative),
    path.join(ROOT, relative),
    path.isAbsolute(raw) ? raw : null,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return { kind: "local", path: candidate };
    }
  }
  return { kind: "missing", path: raw };
}

function stemFromPath(filePath: string): string {
  const base = path.basename(filePath);
  const ext = path.extname(base);
  return normalizeWord(base.slice(0, base.length - ext.length));
}

function stemsCompatible(wordNorm: string, imageStem: string): boolean {
  if (!wordNorm || !imageStem) return false;
  if (wordNorm === imageStem) return true;
  const compact = (s: string) => s.replace(/\s+/g, "");
  if (compact(wordNorm) === compact(imageStem)) return true;
  const aliases = IMAGE_ALIASES[wordNorm] || [];
  if (
    aliases.some(
      (a) =>
        normalizeWord(a) === imageStem ||
        compact(normalizeWord(a)) === compact(imageStem),
    )
  ) {
    return true;
  }
  for (const [wrong, rights] of Object.entries(IMAGE_ALIASES)) {
    if (
      imageStem === wrong &&
      rights.some((r) => normalizeWord(r) === wordNorm)
    ) {
      return true;
    }
  }
  return false;
}

function mdEscape(s: unknown): string {
  return String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function uniqByNorm(arr: AuditRow[]): AuditRow[] {
  const m = new Map<string, AuditRow>();
  for (const x of arr) {
    if (!m.has(x.normalized)) m.set(x.normalized, x);
  }
  return [...m.values()];
}

async function main() {
  if (!(await canUsePrisma())) {
    console.error("DATABASE_URL chưa sẵn sàng.");
    process.exit(1);
  }

  const { images: diskImages, audios: diskAudios } = buildAssetIndex();

  const rows = await prisma.vocabItem.findMany({
    include: { assets: true },
    orderBy: { normalized: "asc" },
  });

  const weekLinks = await prisma.curriculumWeekWord.findMany({
    include: {
      vocabItem: { select: { normalized: true } },
      week: {
        include: {
          month: { select: { titleEn: true, titleVi: true } },
        },
      },
    },
  });

  const weekMap = new Map<string, string[]>();
  for (const link of weekLinks) {
    const key = link.vocabItem.normalized;
    const label = `${link.week.month.titleEn || link.week.month.titleVi || "?"} W${link.week.weekIndex}`;
    if (!weekMap.has(key)) weekMap.set(key, []);
    const list = weekMap.get(key)!;
    if (!list.includes(label)) list.push(label);
  }

  const missingImage: AuditRow[] = [];
  const missingAudio: AuditRow[] = [];
  const brokenImage: AuditRow[] = [];
  const brokenAudio: AuditRow[] = [];
  const wrongImageMapping: AuditRow[] = [];
  const ok: string[] = [];

  for (const row of rows) {
    const word = row.word || row.normalized;
    const norm = normalizeWord(row.normalized || row.word);
    const context = (weekMap.get(row.normalized) || []).slice(0, 3).join("; ") || "—";
    const imagePath = row.assets?.imagePath?.trim() || "";
    const audioPath = row.assets?.audioPath?.trim() || "";

    // --- Image ---
    if (!imagePath) {
      const diskImg = diskImages.get(norm);
      missingImage.push({
        word,
        normalized: norm,
        meaning: row.meaning,
        context,
        dbPath: null,
        diskCandidate: diskImg ? path.relative(ROOT, diskImg) : null,
      });
    } else {
      const resolved = resolveLocalPath(imagePath);
      if (!resolved || resolved.kind === "missing") {
        brokenImage.push({
          word,
          normalized: norm,
          meaning: row.meaning,
          context,
          dbPath: imagePath,
        });
      } else if (resolved.kind === "local") {
        const imageStem = stemFromPath(resolved.path);
        if (!stemsCompatible(norm, imageStem)) {
          wrongImageMapping.push({
            word,
            normalized: norm,
            meaning: row.meaning,
            context,
            dbPath: imagePath,
            imageStem,
            expectedStem: norm,
            diskCandidate: diskImages.get(norm)
              ? path.relative(ROOT, diskImages.get(norm)!)
              : null,
          });
        }
      }
    }

    // --- Audio ---
    if (!audioPath) {
      const diskAud = diskAudios.get(norm);
      missingAudio.push({
        word,
        normalized: norm,
        meaning: row.meaning,
        context,
        dbPath: null,
        diskCandidate: diskAud ? path.relative(ROOT, diskAud) : null,
      });
    } else {
      const resolved = resolveLocalPath(audioPath);
      if (!resolved || resolved.kind === "missing") {
        brokenAudio.push({
          word,
          normalized: norm,
          meaning: row.meaning,
          context,
          dbPath: audioPath,
        });
      }
    }

    if (imagePath && audioPath) {
      const imgOk = resolveLocalPath(imagePath);
      const audOk = resolveLocalPath(audioPath);
      const imgPresent = !!imgOk && imgOk.kind !== "missing";
      const audPresent = !!audOk && audOk.kind !== "missing";
      let mappingOk = true;
      if (imgOk?.kind === "local") {
        mappingOk = stemsCompatible(norm, stemFromPath(imgOk.path));
      }
      if (imgPresent && audPresent && mappingOk) ok.push(norm);
    }
  }

  const missingImageU = uniqByNorm(missingImage);
  const missingAudioU = uniqByNorm(missingAudio);
  const brokenImageU = uniqByNorm(brokenImage);
  const brokenAudioU = uniqByNorm(brokenAudio);
  const wrongMapU = uniqByNorm(wrongImageMapping);
  const missingBoth = missingImageU.filter((i) =>
    missingAudioU.some((a) => a.normalized === i.normalized),
  );
  const missingImageOnly = missingImageU.filter(
    (i) => !missingAudioU.some((a) => a.normalized === i.normalized),
  );
  const missingAudioOnly = missingAudioU.filter(
    (a) => !missingImageU.some((i) => i.normalized === a.normalized),
  );
  const rematchImageHints = missingImageU.filter((x) => x.diskCandidate);
  const rematchAudioHints = missingAudioU.filter((x) => x.diskCandidate);

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const lines: string[] = [];
  lines.push("# Báo cáo audit từ vựng (DB ↔ media)");
  lines.push("");
  lines.push(`> Tạo lúc: ${now} (UTC)`);
  lines.push(`> Nguồn: Neon \`vocab_items\` + \`vocab_assets\``);
  lines.push(
    `> Asset dirs: \`public/\`, \`frontend/public/\`, \`anh_wewin/\`, \`audio_wewin/\``,
  );
  lines.push("");
  lines.push("## Tổng quan");
  lines.push("");
  lines.push("| Chỉ số | Giá trị |");
  lines.push("| --- | ---: |");
  lines.push(`| Tổng vocab_items | ${rows.length} |`);
  lines.push(`| File ảnh trên disk (index) | ${diskImages.size} |`);
  lines.push(`| File audio trên disk (index) | ${diskAudios.size} |`);
  lines.push(
    `| OK (có ảnh + audio, file tồn tại, mapping khớp) | ${ok.length} |`,
  );
  lines.push(`| Thiếu ảnh (path null/rỗng) | ${missingImageU.length} |`);
  lines.push(`| Thiếu audio (path null/rỗng) | ${missingAudioU.length} |`);
  lines.push(`| Thiếu cả ảnh + audio | ${missingBoth.length} |`);
  lines.push(`| Chỉ thiếu ảnh | ${missingImageOnly.length} |`);
  lines.push(`| Chỉ thiếu audio | ${missingAudioOnly.length} |`);
  lines.push(
    `| Ảnh trong DB nhưng file không tồn tại | ${brokenImageU.length} |`,
  );
  lines.push(
    `| Audio trong DB nhưng file không tồn tại | ${brokenAudioU.length} |`,
  );
  lines.push(`| Mapping ảnh sai (stem file ≠ từ) | ${wrongMapU.length} |`);
  lines.push(
    `| Thiếu ảnh nhưng disk có file cùng tên | ${rematchImageHints.length} |`,
  );
  lines.push(
    `| Thiếu audio nhưng disk có file cùng tên | ${rematchAudioHints.length} |`,
  );
  lines.push("");

  type Col = { label: string; get: (x: AuditRow) => unknown };

  function sectionTable(title: string, items: AuditRow[], cols: Col[]) {
    lines.push(`## ${title}`);
    lines.push("");
    if (!items.length) {
      lines.push("_Không có._");
      lines.push("");
      return;
    }
    lines.push(`**Tổng: ${items.length}**`);
    lines.push("");
    lines.push(`| # | ${cols.map((c) => c.label).join(" | ")} |`);
    lines.push(`| --- | ${cols.map(() => "---").join(" | ")} |`);
    items.forEach((item, i) => {
      const cells = cols.map((c) => mdEscape(c.get(item) ?? "—"));
      lines.push(`| ${i + 1} | ${cells.join(" | ")} |`);
    });
    lines.push("");
  }

  sectionTable("1. Mapping ảnh sai (stem file ≠ từ vựng)", wrongMapU, [
    { label: "Từ", get: (x) => x.word },
    { label: "Normalized", get: (x) => x.normalized },
    { label: "Stem ảnh hiện tại", get: (x) => x.imageStem },
    { label: "DB imagePath", get: (x) => x.dbPath },
    {
      label: "File đúng trên disk?",
      get: (x) => x.diskCandidate || "không tìm thấy",
    },
    { label: "Chủ đề / tuần", get: (x) => x.context },
  ]);

  sectionTable("2. Ảnh trong DB nhưng file không tồn tại", brokenImageU, [
    { label: "Từ", get: (x) => x.word },
    { label: "Normalized", get: (x) => x.normalized },
    { label: "DB imagePath", get: (x) => x.dbPath },
    { label: "Chủ đề / tuần", get: (x) => x.context },
  ]);

  sectionTable("3. Audio trong DB nhưng file không tồn tại", brokenAudioU, [
    { label: "Từ", get: (x) => x.word },
    { label: "Normalized", get: (x) => x.normalized },
    { label: "DB audioPath", get: (x) => x.dbPath },
    { label: "Chủ đề / tuần", get: (x) => x.context },
  ]);

  sectionTable("4. Thiếu cả ảnh + audio", missingBoth, [
    { label: "Từ", get: (x) => x.word },
    { label: "Normalized", get: (x) => x.normalized },
    { label: "Disk ảnh?", get: (x) => x.diskCandidate || "—" },
    {
      label: "Disk audio?",
      get: (x) =>
        missingAudioU.find((y) => y.normalized === x.normalized)
          ?.diskCandidate || "—",
    },
    { label: "Chủ đề / tuần", get: (x) => x.context },
  ]);

  sectionTable("5. Chỉ thiếu ảnh", missingImageOnly, [
    { label: "Từ", get: (x) => x.word },
    { label: "Normalized", get: (x) => x.normalized },
    { label: "Disk candidate", get: (x) => x.diskCandidate || "—" },
    { label: "Chủ đề / tuần", get: (x) => x.context },
  ]);

  sectionTable("6. Chỉ thiếu audio", missingAudioOnly, [
    { label: "Từ", get: (x) => x.word },
    { label: "Normalized", get: (x) => x.normalized },
    { label: "Disk candidate", get: (x) => x.diskCandidate || "—" },
    { label: "Chủ đề / tuần", get: (x) => x.context },
  ]);

  sectionTable(
    "7. Có thể rematch ảnh (DB thiếu path nhưng disk có file)",
    rematchImageHints,
    [
      { label: "Từ", get: (x) => x.word },
      { label: "File trên disk", get: (x) => x.diskCandidate },
      { label: "Chủ đề / tuần", get: (x) => x.context },
    ],
  );

  sectionTable(
    "8. Có thể rematch audio (DB thiếu path nhưng disk có file)",
    rematchAudioHints,
    [
      { label: "Từ", get: (x) => x.word },
      { label: "File trên disk", get: (x) => x.diskCandidate },
      { label: "Chủ đề / tuần", get: (x) => x.context },
    ],
  );

  lines.push("## Ghi chú phương pháp");
  lines.push("");
  lines.push(
    "- **Thiếu ảnh/audio**: `vocab_assets.image_path` / `audio_path` null hoặc rỗng.",
  );
  lines.push(
    "- **File không tồn tại**: path trong DB có giá trị nhưng không tìm thấy dưới `public/`, `frontend/public/`, hoặc path relative repo.",
  );
  lines.push(
    "- **Mapping sai**: basename (stem) của file ảnh sau normalize ≠ `normalized` của từ (và không nằm trong alias đã biết).",
  );
  lines.push(
    "- Matching ảnh/audio trên disk theo stem = `normalizeWord(basename)` giống `import:curriculum`.",
  );
  lines.push("");

  fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
  fs.writeFileSync(OUT_MD, lines.join("\n"), "utf8");
  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify(
      {
        generatedAt: now,
        totals: {
          vocabItems: rows.length,
          diskImages: diskImages.size,
          diskAudios: diskAudios.size,
          ok: ok.length,
          missingImage: missingImageU.length,
          missingAudio: missingAudioU.length,
          missingBoth: missingBoth.length,
          missingImageOnly: missingImageOnly.length,
          missingAudioOnly: missingAudioOnly.length,
          brokenImage: brokenImageU.length,
          brokenAudio: brokenAudioU.length,
          wrongImageMapping: wrongMapU.length,
          rematchImageHints: rematchImageHints.length,
          rematchAudioHints: rematchAudioHints.length,
        },
        wrongImageMapping: wrongMapU,
        brokenImage: brokenImageU,
        brokenAudio: brokenAudioU,
        missingBoth,
        missingImageOnly,
        missingAudioOnly,
        rematchImageHints,
        rematchAudioHints,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`Wrote ${OUT_MD}`);
  console.log(`Wrote ${OUT_JSON}`);
  console.log(
    JSON.stringify(
      {
        vocabItems: rows.length,
        ok: ok.length,
        missingImage: missingImageU.length,
        missingAudio: missingAudioU.length,
        missingBoth: missingBoth.length,
        brokenImage: brokenImageU.length,
        brokenAudio: brokenAudioU.length,
        wrongImageMapping: wrongMapU.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
