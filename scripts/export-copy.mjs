#!/usr/bin/env node
/**
 * Writes docs/COPY.md: every site string in Turkish and English, side by side,
 * plus the titles of the knowledge-center articles and legal pages.
 * The source of truth stays in src/messages/*.json and src/content/**.
 * Usage: npm run copy:export
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const tr = JSON.parse(fs.readFileSync(path.join(root, "src/messages/tr.json"), "utf8"));
const en = JSON.parse(fs.readFileSync(path.join(root, "src/messages/en.json"), "utf8"));

const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? flatten(v, prefix ? `${prefix}.${k}` : k) : [[prefix ? `${prefix}.${k}` : k, String(v)]],
  );
const enMap = new Map(flatten(en));
const esc = (s) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

const sections = new Map();
for (const [key, value] of flatten(tr)) {
  const top = key.split(".").slice(0, key.startsWith("home.") || key.startsWith("meta.") ? 2 : 1).join(".");
  if (!sections.has(top)) sections.set(top, []);
  sections.get(top).push([key, value, enMap.get(key) ?? "(missing)"]);
}

let md = `# Ponenti site copy (Türkçe / English)\n\nGenerated from \`src/messages/tr.json\` and \`src/messages/en.json\` by \`npm run copy:export\`. Edit the JSON files, not this document.\n\nPlaceholders in curly braces (\`{check}\`, \`{name}\`) are filled by the site with live values, such as prices from \`src/lib/pricing.ts\`.\n`;
for (const [section, rows] of sections) {
  md += `\n## ${section}\n\n| Key | Türkçe | English |\n|---|---|---|\n`;
  for (const [key, a, b] of rows) md += `| \`${key.slice(section.length + 1) || key}\` | ${esc(a)} | ${esc(b)} |\n`;
}

const metaOf = (file) => {
  const src = fs.readFileSync(file, "utf8");
  const m = src.match(/export const meta = (\{[\s\S]*?\n\});?\n/);
  return m ? Function(`"use strict"; return (${m[1]})`)() : null;
};
md += `\n## Knowledge center articles (MDX, src/content/insights)\n\n| Key | Türkçe | English |\n|---|---|---|\n`;
const byKey = new Map();
for (const locale of ["tr", "en"]) {
  const dir = path.join(root, "src/content/insights", locale);
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"))) {
    const meta = metaOf(path.join(dir, f));
    if (!meta) continue;
    byKey.set(meta.key, { ...byKey.get(meta.key), [locale]: `${meta.title} (/${locale}/${locale === "tr" ? "bilgi-merkezi" : "insights"}/${meta.slug})` });
  }
}
for (const [key, v] of byKey) md += `| \`${key}\` | ${esc(v.tr ?? "")} | ${esc(v.en ?? "")} |\n`;

md += `\n## Legal pages (MDX, src/content/legal)\n\n| Page | Türkçe | English |\n|---|---|---|\n`;
for (const key of ["privacy", "terms", "cookies"]) {
  const a = metaOf(path.join(root, "src/content/legal/tr", `${key}.mdx`));
  const b = metaOf(path.join(root, "src/content/legal/en", `${key}.mdx`));
  md += `| ${key} | ${esc(a?.title ?? "")} | ${esc(b?.title ?? "")} |\n`;
}
md += `\nFull article and legal text lives in the MDX files themselves.\n`;

fs.writeFileSync(path.join(root, "docs/COPY.md"), md);
console.log(`docs/COPY.md written (${[...sections.values()].reduce((n, r) => n + r.length, 0)} strings).`);
