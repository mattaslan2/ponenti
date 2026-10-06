import type { MetadataRoute } from "next";
import { isIndexable, siteUrl } from "@/lib/seo";

/** Blocks all crawling until launch (SITE_INDEXABLE=true). Prospect and portal pages use noindex instead. */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/ingest/", "/monitoring"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
