import fs from "node:fs";
import path from "node:path";
import type { ComponentType } from "react";
import type { Locale } from "@/i18n/routing";

/* ----------------------------- Knowledge center ----------------------------- */

export type ArticleSource = { title: string; url: string; publisher?: string; date?: string };

export type ArticleMeta = {
  key: string;
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  published: string;
  updated: string;
  readingMinutes?: number;
  keywords?: string[];
  sources?: ArticleSource[];
};

type MdxModule<M> = { default: ComponentType; meta: M };

const INSIGHTS_DIR = path.join(process.cwd(), "src/content/insights");

/** File names are the URL slugs: src/content/insights/{locale}/{slug}.mdx */
export function listArticleSlugs(locale: Locale): string[] {
  const dir = path.join(INSIGHTS_DIR, locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") && !f.startsWith("_"))
    .map((f) => f.replace(/\.mdx$/, ""))
    .sort();
}

export async function loadArticle(locale: Locale, slug: string) {
  const mod = (await import(`@/content/insights/${locale}/${slug}.mdx`)) as MdxModule<ArticleMeta>;
  return { Content: mod.default, meta: mod.meta };
}

export async function listArticles(locale: Locale): Promise<ArticleMeta[]> {
  const metas = await Promise.all(listArticleSlugs(locale).map(async (slug) => (await loadArticle(locale, slug)).meta));
  return metas.sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title, locale));
}

/** The same article in the other language (matched by meta.key). */
export async function findArticleByKey(key: string, locale: Locale): Promise<ArticleMeta | null> {
  return (await listArticles(locale)).find((m) => m.key === key) ?? null;
}

/* --------------------------------- Legal ---------------------------------- */

export type LegalKey = "privacy" | "terms" | "cookies";
export type LegalMeta = { key: LegalKey; locale: Locale; slug: string; title: string; description: string; updated: string };

export async function loadLegal(locale: Locale, key: LegalKey) {
  const mod = (await import(`@/content/legal/${locale}/${key}.mdx`)) as MdxModule<LegalMeta>;
  return { Content: mod.default, meta: mod.meta };
}

/* ------------------------------ Prospect pages ----------------------------- */

export type ProspectObservation = { tr: string; en: string; source?: { label: string; url: string } };

export type Prospect = {
  slug: string;
  firm: string;
  preparedOn: string;
  /** true for the template page shipped with the site */
  sample?: boolean;
  observations: ProspectObservation[];
};

const PROSPECTS_DIR = path.join(process.cwd(), "src/content/prospects");

/** One JSON file per prospect: src/content/prospects/{slug}.json (files starting with "_" are ignored). */
export function listProspects(): Prospect[] {
  if (!fs.existsSync(PROSPECTS_DIR)) return [];
  return fs
    .readdirSync(PROSPECTS_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => {
      const data = JSON.parse(fs.readFileSync(path.join(PROSPECTS_DIR, f), "utf8")) as Omit<Prospect, "slug">;
      return { ...data, slug: f.replace(/\.json$/, "") };
    });
}

export function getProspect(slug: string): Prospect | null {
  return listProspects().find((p) => p.slug === slug) ?? null;
}
