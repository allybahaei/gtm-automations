// Full-bleed photo. Black type on a white highlight that follows each line.

import { esc, page, type SlideInput } from "./page.js";

const CSS = `
.slide{
  width:1080px;height:1440px;
  background:#111 center/cover no-repeat;
  display:flex;align-items:center;justify-content:center;
  padding:150px 200px 360px 96px;
}
.copy{width:100%}
.copy.left{text-align:left}
.copy.right{text-align:right}
.heading{margin:0;font-size:26px;font-weight:500;line-height:1.3;letter-spacing:-.01em}
.body{margin:0;font-size:22px;font-weight:400;line-height:1.3}
.heading span,.body span{
  color:#111;background:#fff;
  padding:0.12em 0.48em;border-radius:10px;
  box-decoration-break:clone;-webkit-box-decoration-break:clone;
}
`;

export function overlayHtml(s: SlideInput, backgroundUrl: string): string {
  const body = `<div class="slide" style="background-image:url('${backgroundUrl}')">
  <div class="copy ${s.number % 2 === 1 ? "left" : "right"}">
    <h1 class="heading"><span>${esc(s.heading)}</span></h1>
    ${s.body ? `<p class="body"><span>${esc(s.body)}</span></p>` : ""}
  </div>
</div>`;
  return page(CSS, body);
}
