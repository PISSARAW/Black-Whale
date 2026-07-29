import { DEFAULT_LOCALE, type Locale } from './config'
import { hatsuStatusEn } from './messages/hatsu-status/en'
import { hatsuStatusFr } from './messages/hatsu-status/fr'

/**
 * What the Hatsu layer says while a technique runs. English is the contract;
 * `fr.ts` is typed against it, so a handler cannot reach for a message the French
 * catalogue does not carry.
 */
export type HatsuStatusMessages = typeof hatsuStatusEn

const CATALOGUES: Record<Locale, HatsuStatusMessages> = {
  en: hatsuStatusEn,
  fr: hatsuStatusFr,
}

export function hatsuStatusFor(locale: Locale = DEFAULT_LOCALE): HatsuStatusMessages {
  return CATALOGUES[locale]
}
