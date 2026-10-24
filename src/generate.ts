import Anthropic from "@anthropic-ai/sdk";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { brand } from "./config.js";
import type { Slideshow } from "./types.js";

const FORMATS: Record<string, string> = {
  explainer:
    "Explain one idea so the reader feels they finally get it. Each slide builds on the previous one.",
  myths:
    "Open with a common belief, then overturn it step by step with the real mechanism.",
  path:
    "A learning path: the order to learn a topic from zero, and why that order works.",
  counterintuitive:
    "A run of surprising, true facts about the topic that add up to one bigger insight.",
};

const args = process.argv.slice(2);
const flag = (name: string, fallback?: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const variants = Number(flag("variants", "3"));

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

async function loadWinners(): Promise<string[]> {
  try {
    return JSON.parse(await readFile("data/winners.json", "utf8"));
  } catch {
    return [];
  }
}

function systemPrompt(winners: string[]): string {
  return `You write TikTok photo-slideshow scripts for ${brand.name}, an app that turns any subject into a visual map you can learn from.

Audience: curious adults who learn things for their own sake, not exam prep.
Each slideshow teaches ONE real, accurate idea. Never invent facts or statistics.
Never mention ${brand.name} or any product; a call-to-action slide is added separately.

Rules:
- hook: max 12 words. Specific and concrete. Creates a gap the reader wants closed. No clickbait that the slides don't pay off.
- slides: ${brand.contentSlides.min} to ${brand.contentSlides.max} content slides. heading max 8 words, body max 25 words. Plain language, short sentences.
- Write all slide text in lowercase.
- No emoji. No hashtags inside slide text. No "in this video".
- caption: one or two sentences, max 150 characters.
- hashtags: 3 to 5, lowercase, no # symbol.
${winners.length ? `\nHooks that performed well for us (match the energy, don't copy):\n${winners.map((w) => `- ${w}`).join("\n")}\n` : ""}
Return ONLY valid JSON, no prose, no code fences:
{"variants":[{"hook":"","slides":[{"heading":"","body":""}],"caption":"","hashtags":[""]}]}`;
}

function parseVariants(raw: string): any[] {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("No JSON in response");
  return JSON.parse(raw.slice(start, end + 1)).variants ?? [];
}

function valid(v: any): boolean {
  return (
    typeof v?.hook === "string" &&
    typeof v?.caption === "string" &&
    Array.isArray(v?.hashtags) &&
    Array.isArray(v?.slides) &&
    v.slides.length >= brand.contentSlides.min &&
    v.slides.length <= brand.contentSlides.max &&
    v.slides.every(
      (s: any) => typeof s?.heading === "string" && typeof s?.body === "string",
    )
  );
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

async function generate(topic: string, format: string, winners: string[]) {
  const instruction = FORMATS[format] ?? FORMATS.explainer;
  const res = await client.messages.create({
    model: brand.model,
    max_tokens: 4000,
    system: systemPrompt(winners),
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}\nFormat: ${format}. ${instruction}\nWrite ${variants} distinct variants with different hooks and angles.`,
      },
    ],
  });
  const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const date = new Date().toISOString().slice(0, 10);

  let saved = 0;
  for (const [i, v] of parseVariants(text).entries()) {
    if (!valid(v)) {
      console.warn(`  skipped malformed variant ${i + 1}`);
      continue;
    }
    const show: Slideshow = {
      topic,
      format,
      hook: v.hook.trim(),
      slides: v.slides.map((s: any) => ({
        heading: s.heading.trim(),
        body: s.body.trim(),
      })),
      caption: v.caption.trim(),
      hashtags: v.hashtags.map((h: string) => h.replace(/^#/, "").trim()),
    };
    const dir = `out/${date}-${slug(topic)}-${format}-v${i + 1}`;
    await mkdir(dir, { recursive: true });
    await writeFile(`${dir}/slideshow.json`, JSON.stringify(show, null, 2));
    await writeFile(
      `${dir}/caption.txt`,
      `${show.caption}\n\n${show.hashtags.map((h) => `#${h}`).join(" ")}\n`,
    );
    saved++;
  }
  console.log(`  ${saved} slideshow(s) saved`);
}

const winners = await loadWinners();
const single = flag("topic");
const jobs: { topic: string; format: string }[] = single
  ? [{ topic: single, format: flag("format", "explainer")! }]
  : JSON.parse(await readFile("topics.json", "utf8"));

for (const job of jobs) {
  console.log(`${job.topic} (${job.format})`);
  await generate(job.topic, job.format, winners);
}
