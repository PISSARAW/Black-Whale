import { derived } from 'svelte/store'
import { page } from '$app/stores'
import { localizePath, parsePathname, type Locale } from './config'
import { en } from './messages/en'
import { fr } from './messages/fr'
import type { Messages } from './messages/types'

export type { Messages }

const DICTIONARIES: Record<Locale, Messages> = { en, fr }

export function messagesFor(locale: Locale): Messages {
  return DICTIONARIES[locale]
}

/**
 * The locale of the page being rendered, read straight off the URL rather than
 * carried in load data — that keeps it correct on the server, after hydration,
 * and on every client-side navigation without an invalidation to get wrong.
 */
export const locale = derived(page, ($page): Locale => parsePathname($page.url.pathname).locale)

/** The current route without its locale prefix, for `hreflang` and the switcher. */
export const routePath = derived(page, ($page) => parsePathname($page.url.pathname).path)

/** The active dictionary: `$t.nav.explore`. */
export const t = derived(locale, ($locale) => messagesFor($locale))

/**
 * Rewrites an internal path for the active locale: `href={$link('/ship')}`.
 * Every in-app link has to go through this, otherwise a French visitor
 * following it lands back on the English tree.
 */
export const link = derived(
  locale,
  ($locale) =>
    (path: string): string =>
      localizePath(path, $locale),
)

export {
  alternatePaths,
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_LABELS,
  LOCALE_TAGS,
  localizePath,
  parsePathname,
} from './config'
export type { Locale } from './config'
