import type { AbstractIntlMessages } from "next-intl";

/** Passes only the namespaces a client subtree needs, to keep pages light. */
export function pick(messages: AbstractIntlMessages, keys: string[]): AbstractIntlMessages {
  return Object.fromEntries(keys.filter((k) => k in messages).map((k) => [k, messages[k]])) as AbstractIntlMessages;
}
