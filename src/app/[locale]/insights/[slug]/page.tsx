import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { FinalCta } from "@/components/home/sections";
import { JsonLd } from "@/components/json-ld";
import { findArticleByKey, listArticleSlugs, loadArticle } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { articleJsonLd } from "@/lib/jsonld";
import { buildMetadata, siteUrl, type LocalizedPaths } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { locale: string } }) {
  return listArticleSlugs(params.locale as Locale).map((slug) => ({ slug }));
}

async function pathsFor(locale: Locale, key: string, slug: string): Promise<LocalizedPaths> {
  const other: Locale = locale === "tr" ? "en" : "tr";
  const translation = await findArticleByKey(key, other);
  const own = getPathname({ locale, href: { pathname: "/insights/[slug]", params: { slug } } });
  const theirs = translation
    ? getPathname({ locale: other, href: { pathname: "/insights/[slug]", params: { slug: translation.slug } } })
    : getPathname({ locale: other, href: "/insights" });
  return { [locale]: own, [other]: theirs } as LocalizedPaths;
}

export async function generateMetadata({ params }: PageProps<"/[locale]/insights/[slug]">): Promise<Metadata> {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  const { meta } = await loadArticle(locale, slug);
  return buildMetadata({
    locale,
    paths: await pathsFor(locale, meta.key, slug),
    title: meta.title,
    description: meta.description,
    type: "article",
    publishedTime: meta.published,
    modifiedTime: meta.updated,
  });
}

export default async function ArticlePage({ params }: PageProps<"/[locale]/insights/[slug]">) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  if (!listArticleSlugs(locale).includes(slug)) notFound();
  const { Content, meta } = await loadArticle(locale, slug);
  const t = await getTranslations("insights");
  const common = await getTranslations("common");
  const nav = await getTranslations("nav");
  const path = getPathname({ locale, href: { pathname: "/insights/[slug]", params: { slug } } });

  return (
    <>
      <article className="py-10 sm:py-16">
        <div className="page">
          <nav aria-label={common("breadcrumb")} className="text-[0.875rem] text-mist">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:underline">{common("home")}</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/insights" className="hover:underline">{nav("insights")}</Link>
              </li>
            </ol>
          </nav>
          <header className="mt-6 max-w-3xl">
            <h1 className="text-display-lg">{meta.title}</h1>
            <p className="mt-4 text-lead text-mist">{meta.description}</p>
            <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t border-brass/70 pt-4 text-[0.875rem] text-mist">
              <time dateTime={meta.published}>{common("published", { date: formatDate(meta.published, locale) })}</time>
              <time dateTime={meta.updated}>{common("updated", { date: formatDate(meta.updated, locale) })}</time>
              {meta.readingMinutes ? <span>{common("minutes", { n: meta.readingMinutes })}</span> : null}
            </p>
          </header>

          <div className="prose-ponenti mt-10">
            <Content />
          </div>
          <span id="new-tab-note" hidden>
            {common("opensNewTab")}
          </span>

          {meta.sources && meta.sources.length > 0 && (
            <section aria-labelledby="sources-title" className="mt-14 max-w-prose border-t border-line pt-8">
              <h2 id="sources-title" className="font-display text-[1.5rem]">{common("sources")}</h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-[0.9375rem]">
                {meta.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" aria-describedby="new-tab-note" className="link break-words">
                      {s.title}
                    </a>
                    {s.date ? <span className="text-mist">, {s.date}</span> : null}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <p className="mt-10 max-w-prose rounded-xs border border-line bg-paper p-4 text-[0.875rem] text-mist">{t("disclaimer")}</p>
          <p className="mt-6">
            <Link href="/insights" className="link">{t("back")}</Link>
          </p>
        </div>
      </article>
      <FinalCta location="article_final" title={t("articleCta")} />
      <JsonLd data={articleJsonLd(meta, path, locale)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: common("home"), item: `${siteUrl()}/${locale}` },
            { "@type": "ListItem", position: 2, name: nav("insights"), item: `${siteUrl()}${getPathname({ locale, href: "/insights" })}` },
            { "@type": "ListItem", position: 3, name: meta.title, item: `${siteUrl()}${path}` },
          ],
        }}
      />
    </>
  );
}
