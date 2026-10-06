import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { WindRose } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const nav = await getTranslations("nav");
  const cta = await getTranslations("cta");
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <WindRose className="pointer-events-none absolute -top-10 -right-20 size-96 text-brass opacity-[0.08]" />
      <div className="page relative max-w-3xl">
        <div className="numeral text-brass-deep">404</div>
        <h1 className="mt-4 text-display-lg">{t("title")}</h1>
        <p className="mt-4 text-lead text-mist">{t("body")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button asChild size="lg">
            <Link href="/">{t("home")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/services">{nav("services")}</Link>
          </Button>
          <Link href="/risk-test" className="link inline-flex min-h-11 items-center font-medium">
            {cta("riskTest")}
          </Link>
        </div>
      </div>
    </section>
  );
}
