import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLink } from "@/components/cta";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const nav = await getTranslations("nav");
  const cta = await getTranslations("cta");
  return (
    <section>
      <div className="page py-section">
        <p className="eyebrow kicker figures">404</p>
        <h1 className="mt-6 max-w-[18ch] text-display-xl">{t("title")}</h1>
        <p className="mt-8 max-w-xl text-lead text-mist">{t("body")}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <Button asChild size="lg">
            <Link href="/">{t("home")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/services">{nav("services")}</Link>
          </Button>
          <ArrowLink href="/risk-test" className="self-start sm:ml-3 sm:self-auto">
            {cta("riskTest")}
          </ArrowLink>
        </div>
      </div>
    </section>
  );
}
