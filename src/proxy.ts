import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, routing } from "./i18n/routing";

const intl = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // The bare domain opens in Turkish unless the visitor chose English earlier
  // with the language switcher (stored in NEXT_LOCALE for 12 months).
  if (request.nextUrl.pathname === "/") {
    const saved = request.cookies.get(LOCALE_COOKIE)?.value;
    if (saved === "en") {
      const url = request.nextUrl.clone();
      url.pathname = "/en";
      return NextResponse.redirect(url);
    }
  }
  return intl(request);
}

export const config = {
  // Skip Next internals, files with an extension, the PostHog proxy (/ingest),
  // the Sentry tunnel (/monitoring), Vercel BotID's challenge paths and the Apple
  // touch icon (/apple-icon has no extension, so it was redirected to /tr/apple-icon, a 404).
  matcher: [
    "/((?!api|_next|_vercel|ingest|monitoring|apple-icon|149e9513-01fa-4fb0-aad4-566afd725d1b|.*\\..*).*)",
  ],
};
