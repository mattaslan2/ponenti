import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { loadLegal, type LegalKey } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

const hrefs = { privacy: "/privacy", terms: "/terms", cookies: "/cookies" } as const;

export async function legalMetadata(locale: Locale, key: LegalKey): Promise<Metadata> {
  const { meta } = await loadLegal(locale, key);
  return buildMetadata({ locale, href: hrefs[key], title: meta.title, description: meta.description });
}

export async function LegalDoc({ locale, docKey }: { locale: Locale; docKey: LegalKey }) {
  const { Content, meta } = await loadLegal(locale, docKey);
  const common = await getTranslations("common");
  return (
    <article className="py-10 sm:py-16">
      <div className="page">
        <h1 className="max-w-3xl text-display-lg">{meta.title}</h1>
        <p className="mt-4 border-t border-brass/70 pt-4 text-[0.875rem] text-mist">
          <time dateTime={meta.updated}>{common("updated", { date: formatDate(meta.updated, locale) })}</time>
        </p>
        <div className="prose-ponenti mt-10">
          <Content />
        </div>
        <span id="new-tab-note" hidden>
          {common("opensNewTab")}
        </span>
      </div>
    </article>
  );
}
