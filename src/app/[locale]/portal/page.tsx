import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { WindRose } from "@/components/brand/logo";
import { SampleReport } from "@/components/report/sample-report";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/portal">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta.portal" });
  return buildMetadata({ locale, href: "/portal", title: t("title"), description: t("description"), noindex: true });
}

/** Calm placeholder until the portal app (Supabase auth, own subdomain) goes live. No login form. */
export default async function PortalPage() {
  const t = await getTranslations("portal");
  return (
    <section className="relative overflow-hidden py-14 sm:py-24">
      <WindRose className="pointer-events-none absolute top-10 -right-24 size-96 text-brass opacity-[0.07]" />
      <div className="page relative grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <span className="grid size-12 place-items-center rounded-xs bg-navy text-brass">
            <Lock aria-hidden="true" className="size-5" />
          </span>
          <p className="eyebrow mt-6 text-brass-deep">{t("eyebrow")}</p>
          <h1 className="mt-3 text-display-xl">{t("title")}</h1>
          <p className="mt-5 text-lead text-graphite">{t("body")}</p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/contact" data-track="cta_click" data-track-label="portal_request_access" data-track-location="portal">
              {t("request")}
            </Link>
          </Button>
        </div>
        <div className="lg:col-span-7">
          <SampleReport compact />
        </div>
      </div>
    </section>
  );
}
