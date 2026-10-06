import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { LegalDoc, legalMetadata } from "@/components/legal-doc";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  return legalMetadata((await params).locale as Locale, "privacy");
}

export default async function Page({ params }: PageProps<"/[locale]/privacy">) {
  return <LegalDoc locale={(await params).locale as Locale} docKey="privacy" />;
}
