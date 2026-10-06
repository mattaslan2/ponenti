import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
      <article>
        <div className="page pt-10 pb-section sm:pt-14">
          <nav aria-label={common("breadcrumb")} className="text-caption text-mist-soft">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="transition-colors duration-200 hover:text-navy">{common("home")}</Link>
              </li>
              <li aria-hidden="true" className="text-line">/</li>
              <li>
                <Link href="/insights" className="transition-colors duration-200 hover:text-navy">{nav("insights")}</Link>
              </li>
            </ol>
          </nav>
          <header className="mt-12 max-w-4xl sm:mt-16">
            <h1 className="text-display-lg">{meta.title}</h1>
            <p className="mt-6 max-w-2xl text-lead text-mist">{meta.description}</p>
          </header>

          <div className="mt-12 border-t border-navy pt-8 lg:grid lg:grid-cols-12 lg:gap-x-8">
            <p className="figures flex flex-wrap gap-x-5 gap-y-1 text-caption text-mist-soft lg:col-span-3 lg:block lg:space-y-1.5">
              <time className="lg:block" dateTime={meta.published}>{common("published", { date: formatDate(meta.published, locale) })}</time>
              <time className="lg:block" dateTime={meta.updated}>{common("updated", { date: formatDate(meta.updated, locale) })}</time>
              {meta.readingMinutes ? <span className="lg:block">{common("minutes", { n: meta.readingMinutes })}</span> : null}
            </p>

            <div className="mt-10 lg:col-span-8 lg:col-start-5 lg:mt-0">
              <div className="prose-ponenti">
                <Content />
              </div>
              <span id="new-tab-note" hidden>
                {common("opensNewTab")}
              </span>

              {meta.sources && meta.sources.length > 0 && (
                <section aria-labelledby="sources-title" className="mt-20 max-w-prose border-t border-line pt-8">
                  <h2 id="sources-title" className="eyebrow font-sans">{common("sources")}</h2>
                  <ol className="mt-5 list-decimal space-y-2.5 pl-5 text-small marker:text-mist-soft">
                    {meta.sources.map((s) => (
                      <li key={s.url}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" aria-describedby="new-tab-note" className="link break-words">
                          {s.title}
                        </a>
                        {s.date ? <span className="text-mist-soft">, {s.date}</span> : null}
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <p className="mt-12 max-w-prose border-l border-brass pl-5 text-small text-mist">{t("disclaimer")}</p>
              <p className="mt-10">
                <Link href="/insights" className="link inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium">
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  {t("back")}
                </Link>
              </p>
            </div>
          </div>
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
