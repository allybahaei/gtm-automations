import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const run = promisify(execFile);
const force = process.argv.includes("--force");

await mkdir("zips", { recursive: true });

let packed = 0;
for (const d of await readdir("out", { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const dir = path.join("out", d.name);
  if (!existsSync(path.join(dir, "slide-1.png"))) continue;
  const zip = path.join("zips", `${d.name}.zip`);
  if (!force && existsSync(zip)) continue;

  const files = (await readdir(dir))
    .filter((f) => /^slide-\d+\.png$|^caption\.txt$/.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  // -j drops the folder prefix, so the zip holds just the slides and caption.
  await run("zip", ["-j", "-q", "-FS", path.resolve(zip), ...files.map((f) => path.join(dir, f))]);
  console.log(`packed ${zip}`);
  packed++;
}
console.log(packed ? `${packed} zip(s) in zips/` : "nothing new to pack");
