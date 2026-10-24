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

  for (const [i, slide] of slides.entries()) {
    const background = backgrounds[i % backgrounds.length];
    await page.setContent(slideHtml({ ...slide, number: i + 1 }, background), { waitUntil: "load" });
    const interReady = await page.evaluate(async () => {
      await Promise.all([400, 500, 600].map((weight) => document.fonts.load(`${weight} 32px Inter`)));
      await document.fonts.ready;
      return [400, 500, 600].every((weight) => document.fonts.check(`${weight} 32px Inter`));
    });
    if (!interReady) throw new Error("Inter failed to load");
    await page.screenshot({ path: path.join(dir, `slide-${i + 1}.png`) });
  }
  console.log(`rendered ${slides.length} slides -> ${dir}`);
}

await browser.close();
