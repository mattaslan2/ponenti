import { DraftFact } from "@/components/placeholders";
import { site, type CompanyField } from "@/lib/site";

/** Company facts inside MDX (legal pages): <Company field="legalName" />. */
export function Company({ field }: { field: CompanyField }) {
  return <DraftFact value={site[field]} />;
}
