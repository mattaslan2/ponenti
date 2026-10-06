import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { LegalDoc, legalMetadata } from "@/components/legal-doc";

export async function generateMetadata({ params }: PageProps<"/[locale]/terms">): Promise<Metadata> {
  return legalMetadata((await params).locale as Locale, "terms");
}

export default async function Page({ params }: PageProps<"/[locale]/terms">) {
  return <LegalDoc locale={(await params).locale as Locale} docKey="terms" />;
}
