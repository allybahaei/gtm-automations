// Full-bleed photo. Black type on a white highlight that follows each line.

import { esc, page, type SlideInput } from "./page.js";

const CSS = `
.slide{
  position:relative;
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
.heading span,.body span{color:#111}
.heading,.body{position:relative;z-index:1}
#bubble{position:absolute;left:0;top:0;width:1080px;height:1440px;z-index:0;pointer-events:none}
`;

// Merges every text line into one white shape with rounded outer corners and
// filleted inner corners, so there are no notches where lines differ in width.
// render.ts calls window.__drawBubble() once the fonts are ready.
const BUBBLE_JS = `
window.__drawBubble = function () {
  var R = 12, PAD_X = 12, PAD_Y = 3, SNAP = 2 * R;
  var rows = [];
  document.querySelectorAll(".heading span,.body span").forEach(function (el) {
    Array.prototype.forEach.call(el.getClientRects(), function (r) {
      if (r.width > 1) rows.push({ l: r.left - PAD_X, r: r.right + PAD_X, t: r.top - PAD_Y, b: r.bottom + PAD_Y });
    });
  });
  var old = document.getElementById("bubble");
  if (old) old.remove();
  if (!rows.length) return;
  rows.sort(function (a, b) { return a.t - b.t; });
  var n = rows.length, i;

  for (i = 0; i < n - 1; i++) {
    var y = (rows[i].b + rows[i + 1].t) / 2;
    rows[i].b = y;
    rows[i + 1].t = y;
  }
  for (i = 0; i < n - 1; i++) {
    if (Math.abs(rows[i].l - rows[i + 1].l) < SNAP) rows[i].l = rows[i + 1].l = Math.min(rows[i].l, rows[i + 1].l);
    if (Math.abs(rows[i].r - rows[i + 1].r) < SNAP) rows[i].r = rows[i + 1].r = Math.max(rows[i].r, rows[i + 1].r);
  }
  for (i = n - 2; i >= 0; i--) {
    if (Math.abs(rows[i].l - rows[i + 1].l) < SNAP) rows[i].l = rows[i + 1].l = Math.min(rows[i].l, rows[i + 1].l);
    if (Math.abs(rows[i].r - rows[i + 1].r) < SNAP) rows[i].r = rows[i + 1].r = Math.max(rows[i].r, rows[i + 1].r);
  }

  var pts = [];
  for (i = 0; i < n; i++) { pts.push([rows[i].r, rows[i].t]); pts.push([rows[i].r, rows[i].b]); }
  for (i = n - 1; i >= 0; i--) { pts.push([rows[i].l, rows[i].b]); pts.push([rows[i].l, rows[i].t]); }
  var clean = [];
  pts.forEach(function (p) {
    var q = clean[clean.length - 1];
    if (!q || Math.abs(q[0] - p[0]) > 0.01 || Math.abs(q[1] - p[1]) > 0.01) clean.push(p);
  });
  var again = true;
  while (again) {
    again = false;
    for (i = 0; i < clean.length; i++) {
      var a = clean[(i + clean.length - 1) % clean.length], b = clean[i], c = clean[(i + 1) % clean.length];
      var cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (Math.abs(cross) < 0.01) { clean.splice(i, 1); again = true; break; }
    }
  }

  function unit(p, q) {
    var dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy);
    return { x: dx / d, y: dy / d, d: d };
  }
  var m = clean.length, d = "";
  for (i = 0; i < m; i++) {
    var prev = clean[(i + m - 1) % m], cur = clean[i], next = clean[(i + 1) % m];
    var din = unit(prev, cur), dout = unit(cur, next);
    var rad = Math.min(R, din.d / 2, dout.d / 2);
    var sweep = din.x * dout.y - din.y * dout.x > 0 ? 1 : 0;
    var sx = cur[0] - din.x * rad, sy = cur[1] - din.y * rad;
    var ex = cur[0] + dout.x * rad, ey = cur[1] + dout.y * rad;
    d += (i === 0 ? "M" : "L") + sx + " " + sy + " A" + rad + " " + rad + " 0 0 " + sweep + " " + ex + " " + ey + " ";
  }
  d += "Z";

  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "bubble";
  svg.setAttribute("width", "1080");
  svg.setAttribute("height", "1440");
  var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("fill", "#fff");
  svg.appendChild(path);
  document.querySelector(".slide").appendChild(svg);
};
`;

const lower = (text: string) => esc(text.toLowerCase());

export function overlayHtml(s: SlideInput, backgroundUrl: string): string {
  const body = `<div class="slide" style="background-image:url('${backgroundUrl}')">
  <div class="copy ${s.number % 2 === 1 ? "left" : "right"}">
    <h1 class="heading"><span>${lower(s.heading)}</span></h1>
    ${s.body ? `<p class="body"><span>${lower(s.body)}</span></p>` : ""}
  </div>
</div>
<script>${BUBBLE_JS}</script>`;
  return page(CSS, body);
}
