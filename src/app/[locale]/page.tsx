import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { IznikDivider } from "@/components/brand/decor";
import {
  Doors,
  FactsBand,
  FinalCta,
  FounderTeaser,
  Hero,
  Offer,
  PenaltyPromise,
  ProofSlots,
  Weekly,
  WhatWeDont,
  YourData,
} from "@/components/home/sections";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  return buildMetadata({ locale, href: "/", title: t("title"), description: t("description"), absoluteTitle: true });
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Doors />
      <FactsBand />
      <Offer />
      <Weekly />
      <IznikDivider />
      <WhatWeDont />
      <YourData />
      <PenaltyPromise />
      <FounderTeaser />
      <ProofSlots />
      <FinalCta location="home_final" />
    </>
  );
}
