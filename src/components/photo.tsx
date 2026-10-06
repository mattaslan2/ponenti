import Image from "next/image";
import type { Locale } from "@/i18n/routing";
import type { SitePhoto } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Full-width architectural photo band. Renders nothing until a real photo is configured in src/lib/site.ts. */
export function PhotoBand({ photo, locale, className }: { photo: SitePhoto | null; locale: Locale; className?: string }) {
  if (!photo) return null;
  return (
    <figure className={cn("relative", className)}>
      <div className="relative aspect-[16/7] max-h-[520px] w-full overflow-hidden bg-navy">
        <Image src={photo.src} alt={photo.alt[locale]} fill sizes="100vw" className="object-cover" />
      </div>
      {photo.credit && <figcaption className="page mt-2 text-[0.75rem] text-mist">{photo.credit}</figcaption>}
    </figure>
  );
}
