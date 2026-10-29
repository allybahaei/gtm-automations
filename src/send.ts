import nodemailer from "nodemailer";
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const SENT_FILE = "zips/.sent.json";
const MAX_BYTES = 18 * 1024 * 1024; // Gmail caps messages at 25MB; base64 adds about a third.

const { SMTP_USER, SMTP_PASS } = process.env;
const to = process.env.MAIL_TO ?? "ally.sbahaei@gmail.com";
if (!SMTP_USER || !SMTP_PASS) {
  console.error("Set SMTP_USER and SMTP_PASS (a Gmail app password) in .env.");
  process.exit(1);
}

const sent: string[] = await readFile(SENT_FILE, "utf8").then(JSON.parse, () => []);
const zips = (await readdir("zips").catch(() => [] as string[]))
  .filter((f) => f.endsWith(".zip") && !sent.includes(f))
  .sort();
if (!zips.length) {
  console.log("nothing new to send");
  process.exit(0);
}

// Group the zips into emails that stay under the size cap.
const batches: { name: string; size: number }[][] = [[]];
for (const name of zips) {
  const size = (await stat(path.join("zips", name))).size;
  let batch = batches[batches.length - 1];
  if (batch.length && batch.reduce((n, z) => n + z.size, 0) + size > MAX_BYTES) {
    batches.push((batch = []));
  }
  batch.push({ name, size });
}

const transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

for (const [i, batch] of batches.entries()) {
  await transport.sendMail({
    from: SMTP_USER,
    to,
    subject: `Solus slides: ${batch.length} deck${batch.length > 1 ? "s" : ""}${batches.length > 1 ? ` (${i + 1}/${batches.length})` : ""}`,
    text: batch.map((z) => z.name.replace(/\.zip$/, "")).join("\n"),
    attachments: batch.map((z) => ({ filename: z.name, path: path.join("zips", z.name) })),
  });
  sent.push(...batch.map((z) => z.name));
  await writeFile(SENT_FILE, JSON.stringify(sent, null, 2));
  console.log(`emailed ${batch.length} zip(s) to ${to}`);
}
