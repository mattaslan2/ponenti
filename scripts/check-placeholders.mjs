#!/usr/bin/env node
/**
 * Lists every placeholder still in the site:
 *   [REPLACE WITH REAL ...]           facts, photos, proof slots
 *   R("...")                          company facts in src/lib/site.ts
 *   [confirm ...]                     copy you need to confirm
 *   [SHOW ONLY AFTER E&O CONFIRMS]    the penalty promise
 * Usage: npm run placeholders            (report)
 *        npm run placeholders -- --strict (exit 1 if any [REPLACE WITH REAL] remain; use at launch)
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dirs = ["src", "public", "assets"];
const exts = new Set([".ts", ".tsx", ".mdx", ".json", ".md", ".css", ".svg"]);
const patterns = [
  { kind: "REPLACE", re: /\[REPLACE WITH REAL[^\]\n]*\]?/g, skip: /src[\\/]lib[\\/]site\.ts$/ },
  { kind: "REPLACE", re: /\bR\("([^"]+)"\)/g, file: /src[\\/]lib[\\/]site\.ts$/ },
  { kind: "REPLACE", re: /<ReplaceWithReal label=\{?[`"]([^`"]+)/g, label: (m) => `[REPLACE WITH REAL] proof slot (hidden): ${m[1].replace(/\$\{[^}]+\}:?\s*/, "")}` },
  { kind: "CONFIRM", re: /\[confirm(?:\]|[ :][^\]\n]*\])/gi },
  { kind: "CONFIRM", re: /<Confirm note="([^"]+)"/g, label: (m) => `[confirm] ${m[1]}` },
  { kind: "E&O", re: /<ShowAfterEOConfirms>/g, label: () => "[SHOW ONLY AFTER E&O CONFIRMS] penalty promise (hidden until NEXT_PUBLIC_EO_CONFIRMED=true)" },
];
// Files that implement the placeholder system itself, not placeholders.
const ignore = [/src[\\/]components[\\/]placeholders\.tsx$/, /src[\\/]app[\\/]globals\.css$/];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (exts.has(path.extname(entry.name))) out.push(p);
  }
  return out;
}

const hits = [];
for (const file of dirs.flatMap((d) => walk(path.join(root, d)))) {
  const rel = path.relative(root, file);
  if (rel.endsWith("check-placeholders.mjs") || ignore.some((r) => r.test(rel))) continue;
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const { kind, re, file: only, skip, label } of patterns) {
      if (only && !only.test(rel)) continue;
      if (skip && skip.test(rel)) continue;
      for (const m of line.matchAll(re)) {
        const text = label ? label(m) : m[1] ? `[REPLACE WITH REAL: ${m[1]}]` : m[0];
        hits.push({ kind, rel, line: i + 1, text: text.slice(0, 140) });
      }
    }
  });
}

const order = ["REPLACE", "E&O", "CONFIRM"];
for (const kind of order) {
  const group = hits.filter((h) => h.kind === kind);
  console.log(`\n${kind} (${group.length})`);
  for (const h of group) console.log(`  ${h.rel}:${h.line}  ${h.text}`);
}

const env = ["ATTIO_API_KEY", "RESEND_API_KEY", "LEADS_FROM_EMAIL", "LEADS_ALERT_EMAIL", "NEXT_PUBLIC_POSTHOG_KEY", "SENTRY_DSN", "NEXT_PUBLIC_CAL_LINK", "NEXT_PUBLIC_WHATSAPP_NUMBER", "NEXT_PUBLIC_SITE_URL", "SITE_INDEXABLE"];
const missing = env.filter((k) => !process.env[k]);
console.log(`\nENV not set in this shell (${missing.length}): ${missing.join(", ") || "none"}`);

const replaceCount = hits.filter((h) => h.kind === "REPLACE").length;
if (process.argv.includes("--strict") && replaceCount > 0) {
  console.error(`\n${replaceCount} [REPLACE WITH REAL] placeholders remain.`);
  process.exit(1);
}
