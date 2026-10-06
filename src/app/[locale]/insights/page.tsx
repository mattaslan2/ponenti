import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PageHeader } from "@/components/section";
import { FinalCta } from "@/components/home/sections";
import { listArticles } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/insights">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta.insights" });
  return buildMetadata({ locale, href: "/insights", title: t("title"), description: t("description") });
}

export default async function InsightsPage({ params }: PageProps<"/[locale]/insights">) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations("insights");
  const common = await getTranslations("common");
  const articles = await listArticles(locale);

  return (
    <>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />
      <section className="py-12 sm:py-16">
        <ul className="page grid gap-5 md:grid-cols-2">
          {articles.map((a) => (
            <li key={a.slug} data-reveal>
              <Link
                href={{ pathname: "/insights/[slug]", params: { slug: a.slug } }}
                className="group flex h-full flex-col rounded-sm border border-line bg-paper p-6 transition-colors duration-250 hover:border-brass sm:p-8"
              >
                <p className="text-[0.8125rem] text-mist">
                  <time dateTime={a.updated}>{common("updated", { date: formatDate(a.updated, locale) })}</time>
                  {a.readingMinutes ? ` · ${common("minutes", { n: a.readingMinutes })}` : null}
                </p>
                <h2 className="mt-3 font-display text-[1.625rem] leading-snug">{a.title}</h2>
                <p className="mt-3 flex-1 text-mist">{a.description}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 font-medium text-cobalt">
                  {common("readMore")}
                  <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <FinalCta location="insights_final" />
    </>
  );
}
