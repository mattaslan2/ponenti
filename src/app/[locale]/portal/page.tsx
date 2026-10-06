import type { Metadata } from "next";
import { ArrowRight, Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
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
  const weekly = await getTranslations("home.weekly");
  return (
    <section>
      <div className="page grid items-center gap-x-8 gap-y-16 py-section lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow flex items-center gap-2.5">
            <Lock aria-hidden="true" className="size-3.5" />
            {t("eyebrow")}
          </p>
          <h1 className="mt-6 text-display-xl">{t("title")}</h1>
          <p className="mt-8 max-w-md text-lead text-navy">{t("body")}</p>
          <Button asChild size="lg" className="mt-10">
            <Link href="/contact" data-track="cta_click" data-track-label="portal_request_access" data-track-location="portal">
              {t("request")}
              <ArrowRight aria-hidden="true" className="nudge" />
            </Link>
          </Button>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <SampleReport compact />
          <p className="mt-5 text-caption text-mist-soft">{weekly("note")}</p>
        </div>
      </div>
    </section>
  );
}
