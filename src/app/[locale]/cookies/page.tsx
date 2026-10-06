import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { LegalDoc, legalMetadata } from "@/components/legal-doc";

export async function generateMetadata({ params }: PageProps<"/[locale]/cookies">): Promise<Metadata> {
  return legalMetadata((await params).locale as Locale, "cookies");
}

export default async function Page({ params }: PageProps<"/[locale]/cookies">) {
  return <LegalDoc locale={(await params).locale as Locale} docKey="cookies" />;
}
