// Full-bleed photo. Black type on a white highlight that follows each line.

import { esc, page, type SlideInput } from "./page.js";

const CSS = `
.slide{
  position:relative;
  width:1080px;height:1440px;
  background:#111 center/cover no-repeat;
  overflow:hidden;
}
.copy{position:absolute;width:640px}
.copy.left{text-align:left}
.copy.right{text-align:right}
.heading{margin:0;font-size:26px;font-weight:500;line-height:1.5;letter-spacing:-.01em}
.body{margin:0;font-size:26px;font-weight:500;line-height:1.5}
.heading span,.body span{color:#111}
.heading,.body{position:relative;z-index:1}
#bubble{position:absolute;left:0;top:0;width:1080px;height:1440px;z-index:0;pointer-events:none}
`;

// Merges every text line into one white shape with rounded outer corners and
// filleted inner corners. Each line gets the same padding P on all four sides, measured
// from its ascender top, descender bottom and text ends, and the padded boxes are unioned.
// render.ts calls window.__drawBubble() once the fonts are ready.
const BUBBLE_JS = `
window.__drawBubble = function () {
  var fs = parseFloat(getComputedStyle(document.querySelector(".heading span")).fontSize);
  var R = 0.4 * fs, P = 0.6 * fs, SNAP = 0.5 * R;
  var rows = [];
  document.querySelectorAll(".heading span,.body span").forEach(function (el) {
    Array.prototype.forEach.call(el.getClientRects(), function (r) {
      if (r.width > 1) rows.push({ l: r.left - P, r: r.right + P, t: r.top + 0.21 * fs - P, b: r.bottom - 0.04 * fs + P });
    });
  });
  var old = document.getElementById("bubble");
  if (old) old.remove();
  if (!rows.length) return;
  rows.sort(function (a, b) { return a.t - b.t; });
  var n = rows.length, i;

  for (i = 0; i < n - 1; i++) {
    if (Math.abs(rows[i].l - rows[i + 1].l) < SNAP) rows[i].l = rows[i + 1].l = Math.min(rows[i].l, rows[i + 1].l);
    if (Math.abs(rows[i].r - rows[i + 1].r) < SNAP) rows[i].r = rows[i + 1].r = Math.max(rows[i].r, rows[i + 1].r);
  }
  for (i = n - 2; i >= 0; i--) {
    if (Math.abs(rows[i].l - rows[i + 1].l) < SNAP) rows[i].l = rows[i + 1].l = Math.min(rows[i].l, rows[i + 1].l);
    if (Math.abs(rows[i].r - rows[i + 1].r) < SNAP) rows[i].r = rows[i + 1].r = Math.max(rows[i].r, rows[i + 1].r);
  }

  var ys = [];
  rows.forEach(function (row) { ys.push(row.t, row.b); });
  ys.sort(function (a, b) { return a - b; });
  var slabs = [];
  for (i = 0; i < ys.length - 1; i++) {
    if (ys[i + 1] - ys[i] < 0.01) continue;
    var y0 = ys[i], y1 = ys[i + 1];
    var cover = rows.filter(function (row) { return row.t <= y0 + 0.01 && row.b >= y1 - 0.01; });
    if (!cover.length) continue;
    slabs.push({
      l: Math.min.apply(null, cover.map(function (row) { return row.l; })),
      r: Math.max.apply(null, cover.map(function (row) { return row.r; })),
      t: y0,
      b: y1
    });
  }

  // Fill thin slits where a short line sits between two longer ones.
  for (var pass = 0; pass < 2; pass++) {
    for (i = 1; i < slabs.length - 1; i++) {
      if (slabs[i].b - slabs[i].t > 1.2 * fs) continue;
      slabs[i].r = Math.max(slabs[i].r, Math.min(slabs[i - 1].r, slabs[i + 1].r));
      slabs[i].l = Math.min(slabs[i].l, Math.max(slabs[i - 1].l, slabs[i + 1].l));
    }
  }

  var pts = [];
  for (i = 0; i < slabs.length; i++) { pts.push([slabs[i].r, slabs[i].t]); pts.push([slabs[i].r, slabs[i].b]); }
  for (i = slabs.length - 1; i >= 0; i--) { pts.push([slabs[i].l, slabs[i].b]); pts.push([slabs[i].l, slabs[i].t]); }
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
  <div class="copy ${s.number % 2 === 1 ? "left" : "right"}" style="left:${s.x ?? 220}px;top:${s.y ?? 560}px">
    <h1 class="heading"><span>${lower(s.heading)}</span></h1>
    ${s.body ? `<p class="body"><span>${lower(s.body)}</span></p>` : ""}
  </div>
</div>
<script>${BUBBLE_JS}</script>`;
  return page(CSS, body);
}
