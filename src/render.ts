import { chromium } from "playwright";
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { brand } from "./config.js";
import { slideHtml, type SlideInput } from "./template.js";
import type { Slideshow } from "./types.js";

const BG_DIR = "images";
const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function loadBackgrounds(): Promise<string[]> {
  let names: string[] = [];
  try {
    names = (await readdir(BG_DIR))
      .filter((name) => MIME[path.extname(name).toLowerCase()])
      .sort();
  } catch {
    names = [];
  }
  if (!names.length) {
    console.error(`No images in ${BG_DIR}/. Add jpg, png, or webp files and re-render.`);
    process.exit(1);
  }
  const urls: string[] = [];
  for (const name of names) {
    const ext = path.extname(name).toLowerCase();
    const bytes = await readFile(path.join(BG_DIR, name));
    urls.push(`data:${MIME[ext]};base64,${bytes.toString("base64")}`);
  }
  return urls;
}

// Seeded PRNG so a deck gets the same photos every time it is re-rendered.
function seedFrom(text: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const force = process.argv.includes("--force");

let dirs: string[] = [];
try {
  dirs = (await readdir("out", { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => path.join("out", d.name));
} catch {
  console.error("No out/ folder yet. Run `npm run generate` first.");
  process.exit(1);
}

const backgrounds = await loadBackgrounds();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: brand.size });

for (const dir of dirs) {
  const file = path.join(dir, "slideshow.json");
  if (!existsSync(file)) continue;
  if (!force && existsSync(path.join(dir, "slide-1.png"))) continue;

  const show: Slideshow = JSON.parse(await readFile(file, "utf8"));
  const slides: Omit<SlideInput, "number">[] = [
    { kind: "hook", heading: show.hook },
    ...show.slides.map((s): Omit<SlideInput, "number"> => ({ kind: "content", heading: s.heading, body: s.body })),
    { kind: "cta", heading: brand.cta.heading, body: brand.cta.sub },
  ];

  // Random, no-repeat order per deck. Once every photo has been used, reshuffle for
  // the next pass, so a photo only repeats after all the others have appeared.
  const rand = seedFrom(dir);
  let pool: string[] = [];
  const nextBackground = (): string => {
    if (!pool.length) pool = shuffle(backgrounds, rand);
    return pool.pop() as string;
  };

  // Text block sits at a random spot, kept away from the top and the TikTok UI zone at the bottom.
  const place = seedFrom(`${dir}:layout`);
  const between = (min: number, max: number) => Math.round(min + place() * (max - min));

  for (const [i, slide] of slides.entries()) {
    const background = nextBackground();
    const x = between(60, 340);
    const y = between(420, 760);
    await page.setContent(slideHtml({ ...slide, number: i + 1, x, y }, background), { waitUntil: "load" });
    const interReady = await page.evaluate(async () => {
      await Promise.all([400, 500, 600].map((weight) => document.fonts.load(`${weight} 32px Inter`)));
      await document.fonts.ready;
      return [400, 500, 600].every((weight) => document.fonts.check(`${weight} 32px Inter`));
    });
    if (!interReady) throw new Error("Inter failed to load");
    await page.evaluate(() => (window as any).__drawBubble());
    await page.screenshot({ path: path.join(dir, `slide-${i + 1}.png`) });
  }
  console.log(`rendered ${slides.length} slides -> ${dir}`);
}

await browser.close();
