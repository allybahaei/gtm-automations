// Full-bleed photo, small Inter type, a slight drop shadow. Nothing else.

export type SlideKind = "hook" | "content" | "cta";

export interface SlideInput {
  kind: SlideKind;
  heading: string;
  body?: string;
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap');
*{box-sizing:border-box}
html,body{margin:0;width:1080px;height:1920px}
body{background:#111}
/* TikTok UI covers the right edge and the bottom ~400px, so keep text clear of both. */
.slide{
  width:1080px;height:1920px;
  background-size:cover;background-position:center;
  display:flex;align-items:center;justify-content:center;
  padding:200px 200px 480px 96px;
}
.copy{
  width:100%;
  font-family:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;
  color:#fff;
  text-align:center;
  text-shadow:0 2px 6px rgba(0,0,0,.45);
}
.heading{margin:0;font-size:34px;font-weight:500;line-height:1.35;letter-spacing:-.01em}
.body{margin:16px 0 0;font-size:30px;font-weight:400;line-height:1.4}
`;

export function slideHtml(s: SlideInput, backgroundUrl: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head>
<body><div class="slide" style="background-image:url('${backgroundUrl}')">
  <div class="copy">
    <h1 class="heading">${esc(s.heading)}</h1>
    ${s.body ? `<p class="body">${esc(s.body)}</p>` : ""}
  </div>
</div></body></html>`;
}
