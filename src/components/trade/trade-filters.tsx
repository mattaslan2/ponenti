"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { usdCompact } from "@/lib/trade/format";
import { overviewHref, productHref } from "@/lib/trade/links";

type Suggestion = {
  code: string;
  level: number;
  label: string;
  chapter: string;
  usImports: number;
  fromTurkiye: number;
};
type Option = { iso2: string; name: string };

/**
 * One filter row: product search (HS code, GTİP or words) and the partner
 * country. Works without JavaScript as a plain GET form; with it, the search
 * suggests products as you type (ARIA combobox) and the country applies at once.
 */
export function TradeFilters({
  action,
  country,
  hs,
  query = "",
  countries,
  labels,
}: {
  /** Form target without JavaScript (the current trade page path). */
  action: string;
  country: string;
  hs?: string;
  query?: string;
  countries: { top: Option[]; rest: Option[] };
  labels: {
    search: string;
    placeholder: string;
    hint: string;
    noResults: string;
    country: string;
    countryTop: string;
    countryAll: string;
    apply: string;
    usImports: string;
    fromTurkiye: string;
    chapter: string;
  };
}) {
  const locale = useLocale();
  const router = useRouter();
  const uid = useId();
  const listId = `${uid}-list`;
  const [q, setQ] = useState(query);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [searched, setSearched] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const countryTimer = useRef<number | undefined>(undefined);
  const request = useRef<AbortController | null>(null);
  const select = useRef<HTMLSelectElement>(null);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      window.clearTimeout(countryTimer.current);
    },
    [],
  );

  // Back/Forward changes the country without remounting this form (only the query string changes),
  // so bring the select in line with the page. Remounting instead would drop keyboard focus.
  useEffect(() => {
    if (select.current) select.current.value = country;
  }, [country]);

  const fetchResults = (value: string) => {
    window.clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      setSearched(false);
      return;
    }
    timer.current = window.setTimeout(async () => {
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      try {
        const res = await fetch(`/api/trade/search?q=${encodeURIComponent(value)}&locale=${locale}`, { signal: controller.signal });
        const data = (await res.json()) as { results: Suggestion[] };
        setResults(data.results);
        setActive(data.results.length ? 0 : -1);
        setSearched(true);
        setOpen(true);
      } catch {
        /* aborted or offline: keep the plain form */
      }
    }, 180);
  };

  const go = (code: string) => {
    setOpen(false);
    router.push(productHref(code, country));
  };

  // On Windows a focused select fires `change` on every arrow key or typed letter: wait for a pause,
  // so keyboard users get one page load and one history entry, not one per country passed.
  const changeCountry = (iso2: string) => {
    window.clearTimeout(countryTimer.current);
    // scroll: false keeps the reader at the filters while the figures below reload.
    countryTimer.current = window.setTimeout(() => router.push(hs ? productHref(hs, iso2) : overviewHref(iso2), { scroll: false }), 300);
  };

  return (
    <form action={action} method="get" role="search" className="grid gap-6 md:grid-cols-[minmax(0,1fr)_17rem] md:items-start">
      <div className="relative">
        <label htmlFor={`${uid}-q`} className="text-small font-medium text-navy">
          {labels.search}
        </label>
        <div className="relative mt-2.5">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-mist-soft" />
          <input
            id={`${uid}-q`}
            name="q"
            type="search"
            value={q}
            autoComplete="off"
            spellCheck={false}
            placeholder={labels.placeholder}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-describedby={`${uid}-hint`}
            aria-activedescendant={open && active >= 0 ? `${uid}-opt-${active}` : undefined}
            onChange={(e) => {
              setQ(e.target.value);
              fetchResults(e.target.value);
            }}
            onFocus={() => results.length && setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && results.length) {
                e.preventDefault();
                setOpen(true);
                setActive((i) => (i + 1) % results.length);
              } else if (e.key === "ArrowUp" && results.length) {
                e.preventDefault();
                setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
              } else if (e.key === "Enter" && open && active >= 0 && results[active]) {
                e.preventDefault();
                go(results[active].code);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            className="h-14 w-full rounded-xs border border-field bg-paper pr-4 pl-11 text-base text-navy transition-colors duration-200 placeholder:text-mist-soft hover:border-navy/70 focus-visible:border-navy"
          />
          <ul
            id={listId}
            role="listbox"
            aria-label={labels.search}
            hidden={!open}
            className="sheet absolute inset-x-0 top-full z-30 mt-1.5 max-h-[22rem] overflow-y-auto py-1.5"
          >
            {results.map((r, i) => (
              <li
                key={r.code}
                id={`${uid}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(r.code)}
                onMouseEnter={() => setActive(i)}
                className="cursor-pointer px-4 py-3 aria-selected:bg-sand"
              >
                <span className="flex items-baseline gap-2">
                  <span className="figures shrink-0 text-caption font-semibold text-navy">{r.code}</span>
                  <span className="line-clamp-2 text-small leading-snug text-navy" lang={locale === "tr" && r.level > 2 ? "en" : undefined}>
                    {r.label}
                  </span>
                </span>
                <span className="figures mt-1 block pl-0 text-[0.75rem] text-mist-soft">
                  {r.level > 2 && `${labels.chapter} ${r.code.slice(0, 2)}: ${r.chapter} · `}
                  {labels.usImports} {usdCompact(r.usImports, locale)}
                  {r.fromTurkiye > 0 && ` · ${labels.fromTurkiye} ${usdCompact(r.fromTurkiye, locale)}`}
                </span>
              </li>
            ))}
            {searched && results.length === 0 && <li className="px-4 py-3 text-small text-mist">{labels.noResults}</li>}
          </ul>
        </div>
        <p id={`${uid}-hint`} className="mt-2.5 text-caption text-mist-soft">
          {labels.hint}
        </p>
      </div>

      <div>
        <label htmlFor={`${uid}-country`} className="text-small font-medium text-navy">
          {labels.country}
        </label>
        <select
          ref={select}
          id={`${uid}-country`}
          name="country"
          defaultValue={country}
          onChange={(e) => changeCountry(e.target.value)}
          className="mt-2.5 h-14 w-full rounded-xs border border-field bg-paper px-3.5 text-base text-navy transition-colors duration-200 hover:border-navy/70 focus-visible:border-navy"
        >
          <optgroup label={labels.countryTop}>
            {countries.top.map((c) => (
              <option key={c.iso2} value={c.iso2}>
                {c.name}
              </option>
            ))}
          </optgroup>
          <optgroup label={labels.countryAll}>
            {countries.rest.map((c) => (
              <option key={c.iso2} value={c.iso2}>
                {c.name}
              </option>
            ))}
          </optgroup>
        </select>
        <noscript>
          <button type="submit" className="mt-3 h-12 rounded-xs bg-navy px-6 text-[0.9375rem] font-medium text-ivory">
            {labels.apply}
          </button>
        </noscript>
      </div>
    </form>
  );
}
