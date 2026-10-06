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
      <section>
        <div className="page pb-section">
          <ul>
            {articles.map((a) => (
              <li key={a.slug} data-reveal className="border-b border-line">
                <Link
                  href={{ pathname: "/insights/[slug]", params: { slug: a.slug } }}
                  className="hover-rule grid gap-x-8 gap-y-4 py-10 lg:grid-cols-12 lg:py-14"
                >
                  <p className="figures text-caption text-mist-soft lg:col-span-3 lg:pt-3">
                    <time dateTime={a.updated}>{common("updated", { date: formatDate(a.updated, locale) })}</time>
                    {a.readingMinutes ? (
                      <>
                        <span aria-hidden="true" className="lg:hidden">
                          {" · "}
                        </span>
                        <span className="lg:block">{common("minutes", { n: a.readingMinutes })}</span>
                      </>
                    ) : null}
                  </p>
                  <div className="lg:col-span-8">
                    <h2 className="text-display-md">{a.title}</h2>
                    <p className="mt-4 max-w-2xl text-mist">{a.description}</p>
                    <span className="mt-6 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-navy lg:hidden">
                      {common("readMore")}
                      <ArrowRight aria-hidden="true" className="nudge size-4" />
                    </span>
                  </div>
                  <span className="hidden justify-self-end pt-3 lg:col-span-1 lg:block">
                    <ArrowRight aria-hidden="true" className="nudge size-5 text-navy" />
                    <span className="sr-only">{common("readMore")}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <FinalCta location="insights_final" />
    </>
  );
}
