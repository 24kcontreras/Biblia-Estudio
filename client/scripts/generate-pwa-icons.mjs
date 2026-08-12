import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

const STROKE = `M16 7v18M9 12c3-1.5 4.5-1.5 7 0M9 20c3-1.5 4.5-1.5 7 0M23 12c-3-1.5-4.5-1.5-7 0M23 20c-3-1.5-4.5-1.5-7 0`;
const BG = "#7c2d12";
const FG = "#faf6ee";

const anySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${BG}"/><path d="${STROKE}" stroke="${FG}" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;

// Maskable: full-bleed square background (no rounding — the OS applies its own mask shape).
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${BG}"/><path d="${STROKE}" stroke="${FG}" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;

const jobs = [
  { svg: anySvg, size: 192, file: "icon-192.png" },
  { svg: anySvg, size: 512, file: "icon-512.png" },
  { svg: maskableSvg, size: 192, file: "maskable-192.png" },
  { svg: maskableSvg, size: 512, file: "maskable-512.png" },
  { svg: anySvg, size: 180, file: "apple-touch-icon.png" },
];

for (const job of jobs) {
  const buffer = await sharp(Buffer.from(job.svg)).resize(job.size, job.size).png().toBuffer();
  writeFileSync(resolve(outDir, job.file), buffer);
  console.log(`wrote ${job.file} (${job.size}x${job.size})`);
}
