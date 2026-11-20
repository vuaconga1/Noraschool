/**
 * Copy missing curriculum approved PNGs from anh_wewin / other alts.
 * Converts to PNG and punches near-solid corner backgrounds to alpha.
 *
 *   npx tsx scripts/sync-approved-from-alts.ts
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import themes from "../src/data/curriculum-themes.json";

const ROOT = path.resolve(__dirname, "..");
const APPROVED = path.join(ROOT, "public/assets/vocab/approved");

/** Known bad alt content — do not copy; regenerate instead */
const SKIP_ALTS = new Set(["skin"]);

function wordFileStem(word: string): string {
  const cleaned = word
    .trim()
    .toLowerCase()
    .replace(/\s+chỉ\s+dành\s+cho\b.*$/u, "")
    .replace(/\s+\d+\s*-\s*\d+\s*yo\b.*$/u, "")
    .trim();
  return cleaned.replace(/\s+/g, "-");
}

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

function walk(dir: string, out: string[] = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, out);
    else out.push(f);
  }
  return out;
}

function altRank(rel: string): number {
  const p = rel.toLowerCase().replace(/\\/g, "/");
  if (p.includes("/assets/vocab/approved/")) return 0;
  if (p.includes("/curriculum/from-anschool/")) return 1;
  if (p.includes("/anh_wewin/")) return 2;
  if (p.includes("/pending/")) return 8;
  if (p.includes("/rejected/")) return 9;
  return 5;
}

async function toTransparentPng(src: string, dest: string) {
  const img = sharp(src).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (channels < 4) throw new Error(`Expected alpha: ${src}`);

  // Sample 4 corners to detect solid bg
  const idx = (x: number, y: number) => (y * width + x) * channels;
  const corners = [
    idx(0, 0),
    idx(width - 1, 0),
    idx(0, height - 1),
    idx(width - 1, height - 1),
  ].map((i) => [data[i], data[i + 1], data[i + 2]] as const);

  const avg = [0, 0, 0];
  for (const c of corners) {
    avg[0] += c[0];
    avg[1] += c[1];
    avg[2] += c[2];
  }
  avg[0] = Math.round(avg[0] / 4);
  avg[1] = Math.round(avg[1] / 4);
  avg[2] = Math.round(avg[2] / 4);

  const isNearWhite = avg[0] > 240 && avg[1] > 240 && avg[2] > 240;
  const isNearBlack = avg[0] < 20 && avg[1] < 20 && avg[2] < 20;
  const cornerSpread = Math.max(
    ...corners.map(
      (c) =>
        Math.abs(c[0] - avg[0]) + Math.abs(c[1] - avg[1]) + Math.abs(c[2] - avg[2]),
    ),
  );

  // Only punch bg when corners agree on a solid color
  if ((isNearWhite || isNearBlack) && cornerSpread < 30) {
    const thr = isNearWhite ? 28 : 28;
    for (let i = 0; i < data.length; i += channels) {
      const dr = Math.abs(data[i] - avg[0]);
      const dg = Math.abs(data[i + 1] - avg[1]);
      const db = Math.abs(data[i + 2] - avg[2]);
      if (dr + dg + db <= thr) data[i + 3] = 0;
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(dest);
}

async function main() {
  fs.mkdirSync(APPROVED, { recursive: true });

  const imageExt = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
  const diskByNorm = new Map<string, string[]>();
  for (const dir of [
    path.join(ROOT, "public/assets/vocab"),
    path.join(ROOT, "anh_wewin"),
  ]) {
    for (const f of walk(dir)) {
      if (!imageExt.has(path.extname(f).toLowerCase())) continue;
      const stem = normalizeWord(path.basename(f, path.extname(f)));
      if (!stem) continue;
      if (!diskByNorm.has(stem)) diskByNorm.set(stem, []);
      diskByNorm.get(stem)!.push(f);
    }
  }

  const words = new Set<string>();
  for (const m of themes as Array<{ weeks: Array<{ words: string[] }> }>) {
    for (const w of m.weeks) for (const word of w.words) words.add(word);
  }

  let copied = 0;
  let skipped = 0;
  let already = 0;
  const stillMissing: string[] = [];

  for (const word of [...words].sort()) {
    const stem = wordFileStem(word);
    const dest = path.join(APPROVED, `${stem}.png`);
    if (fs.existsSync(dest)) {
      already += 1;
      continue;
    }
    if (SKIP_ALTS.has(stem) || SKIP_ALTS.has(normalizeWord(word))) {
      stillMissing.push(word);
      skipped += 1;
      continue;
    }

    const norm = normalizeWord(word);
    const alts = (diskByNorm.get(norm) || [])
      .map((f) => ({ f, rel: path.relative(ROOT, f).replace(/\\/g, "/") }))
      .filter((x) => !x.rel.includes("/rejected/") && !x.rel.includes("/temp/"))
      .sort((a, b) => altRank(a.rel) - altRank(b.rel));

    if (!alts.length) {
      stillMissing.push(word);
      continue;
    }

    const src = alts[0].f;
    try {
      await toTransparentPng(src, dest);
      copied += 1;
      console.log(`OK ${stem} ← ${alts[0].rel}`);
    } catch (e) {
      console.warn(`FAIL ${stem}:`, e);
      stillMissing.push(word);
    }
  }

  console.log(
    JSON.stringify({ already, copied, skipped, stillMissingCount: stillMissing.length, stillMissing }, null, 2),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
