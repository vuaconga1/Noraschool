/**
 * One-off audit: Excel words vs image/audio assets (no DB writes).
 * node scripts/audit-missing-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const excelCandidates = [
  path.join(ROOT, "0. CHỦ ĐỀ x GIÁO VIÊN (1).xlsx"),
  path.join(ROOT, "data/curriculum/chu-de-giao-vien.xlsx"),
];
const excelPath = excelCandidates.find((p) => fs.existsSync(p));
if (!excelPath) {
  console.error("Excel not found");
  process.exit(1);
}

const ASSET_DIRS = [
  path.join(ROOT, "public"),
  path.join(ROOT, "frontend/public"),
  path.join(ROOT, "anh_wewin"),
  path.join(ROOT, "audio_wewin"),
];

function normalizeWord(raw) {
  return String(raw)
    .normalize("NFKC")
    .replace(/^review\s*:?\s*/i, "")
    // Drop age / level notes: (5-6yo), chỉ dành cho level 5-6yo, etc.
    .replace(/\(?\s*\d\s*[-–]\s*\d\s*yo\s*\)?/gi, " ")
    .replace(/chỉ dành cho level\s*\d\s*[-–]\s*\d\s*yo/gi, " ")
    .replace(/level\s*\d\s*[-–]\s*\d\s*yo/gi, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function parseWordList(cell) {
  if (cell == null) return [];
  const text = String(cell).replace(/\r/g, "\n");
  // Drop leading "Label: " before first comma/list (per line)
  const cleaned = text.replace(/^[^:\n]{0,40}:\s*/gm, "");
  const parts = cleaned
    .split(/[,\n;/|]+/)
    .map((p) => p.replace(/^review\s*:?\s*/i, "").trim())
    .filter(Boolean);
  const words = [];
  for (const p of parts) {
    const n = normalizeWord(p);
    // Skip junk fragments / pure numbers
    if (!n || n.length > 60) continue;
    if (/^\d+$/.test(n)) continue;
    if (n === "yo" || n === "senses") continue;
    words.push(n);
  }
  return [...new Set(words)];
}

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

function buildAssetIndex() {
  const images = new Map();
  const audios = new Map();
  const imageExt = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);
  const audioExt = new Set([".mp3", ".wav", ".ogg", ".m4a"]);
  for (const dir of ASSET_DIRS) {
    for (const file of walkFiles(dir)) {
      const ext = path.extname(file).toLowerCase();
      const stem = normalizeWord(path.basename(file, ext));
      if (!stem) continue;
      if (imageExt.has(ext) && !images.has(stem)) images.set(stem, file);
      if (audioExt.has(ext) && !audios.has(stem)) audios.set(stem, file);
    }
  }
  return { images, audios };
}

const wb = XLSX.readFile(excelPath);
const sheetName =
  wb.SheetNames.find((n) => /chủ đề|chu de|2026/i.test(n)) ?? wb.SheetNames[0];
const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
  header: 1,
  defval: null,
});
const { images, audios } = buildAssetIndex();

const allWords = new Set();
for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row || !row[0]) continue;
  const titleVi = String(row[1] ?? "").trim();
  const titleEn = String(row[2] ?? "").trim();
  if (!titleVi && !titleEn) continue;
  for (let w = 1; w <= 4; w++) {
    for (const word of parseWordList(row[4 + w])) {
      allWords.add(word);
    }
  }
}

const missingImage = [];
const missingAudio = [];
const missingBoth = [];
const missingEither = [];
const sorted = [...allWords].sort();

for (const word of sorted) {
  const hasImg = images.has(word);
  const hasAud = audios.has(word);
  if (!hasImg) missingImage.push(word);
  if (!hasAud) missingAudio.push(word);
  if (!hasImg && !hasAud) missingBoth.push(word);
  if (!hasImg || !hasAud) missingEither.push(word);
}

const missingImageOnly = missingImage.filter((w) => audios.has(w));
const missingAudioOnly = missingAudio.filter((w) => images.has(w));

const out = {
  excel: path.basename(excelPath),
  sheet: sheetName,
  assetCounts: { images: images.size, audios: audios.size },
  totalUniqueWords: allWords.size,
  completeCount: allWords.size - missingEither.length,
  missingImageCount: missingImage.length,
  missingAudioCount: missingAudio.length,
  missingBothCount: missingBoth.length,
  missingImageOnlyCount: missingImageOnly.length,
  missingAudioOnlyCount: missingAudioOnly.length,
  missingBoth,
  missingImageOnly,
  missingAudioOnly,
};

const reportDir = path.join(ROOT, "data/curriculum");
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(
  path.join(reportDir, "missing-assets-report.json"),
  JSON.stringify(out, null, 2),
  "utf8",
);
fs.writeFileSync(
  path.join(reportDir, "missing-assets-report.txt"),
  [
    `Excel: ${out.excel}`,
    `Sheet: ${out.sheet}`,
    `Unique words: ${out.totalUniqueWords}`,
    `Complete (image+audio): ${out.completeCount}`,
    `Missing image: ${out.missingImageCount}`,
    `Missing audio: ${out.missingAudioCount}`,
    `Missing both: ${out.missingBothCount}`,
    "",
    "=== MISSING BOTH ===",
    ...missingBoth,
    "",
    "=== MISSING IMAGE ONLY ===",
    ...missingImageOnly,
    "",
    "=== MISSING AUDIO ONLY ===",
    ...missingAudioOnly,
    "",
  ].join("\n"),
  "utf8",
);

console.log(
  JSON.stringify(
    {
      excel: out.excel,
      sheet: out.sheet,
      assetCounts: out.assetCounts,
      totalUniqueWords: out.totalUniqueWords,
      completeCount: out.completeCount,
      missingImageCount: out.missingImageCount,
      missingAudioCount: out.missingAudioCount,
      missingBothCount: out.missingBothCount,
      missingImageOnlyCount: out.missingImageOnlyCount,
      missingAudioOnlyCount: out.missingAudioOnlyCount,
    },
    null,
    2,
  ),
);
console.log("Report: data/curriculum/missing-assets-report.txt");
