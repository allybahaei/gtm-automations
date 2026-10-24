import { interFontCss } from "../fonts.js";

export type SlideKind = "hook" | "content" | "cta";

export interface SlideInput {
  kind: SlideKind;
  heading: string;
  body?: string;
  /** 1-based slide number. */
  number: number;
  /** Top-left corner of the text block in px. Defaults to roughly centred. */
  x?: number;
  y?: number;
}

export const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const BASE = `
*{box-sizing:border-box}
html,body{margin:0;width:1080px;height:1440px}
html{font-family:Inter,sans-serif;font-feature-settings:"kern" 1,"liga" 1,"calt" 1;-webkit-font-smoothing:antialiased}
body{background:#111}
body *{font-family:inherit}
`;

export function page(css: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${interFontCss}${BASE}${css}</style></head><body>${body}</body></html>`;
}
