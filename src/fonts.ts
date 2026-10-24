import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets/fonts");

const weights = [400, 500, 600] as const;

function face(weight: number): string {
  const file = path.join(dir, `inter-${weight}.woff2`);
  let b64: string;
  try {
    b64 = readFileSync(file).toString("base64");
  } catch {
    throw new Error(`Missing ${file}. Inter is required for every slideshow.`);
  }
  return `@font-face{font-family:Inter;font-style:normal;font-weight:${weight};font-display:block;src:url("data:font/woff2;base64,${b64}") format("woff2")}`;
}

export const interFontCss = weights.map(face).join("");
