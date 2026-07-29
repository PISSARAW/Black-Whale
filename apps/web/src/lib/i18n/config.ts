export const LOCALES = ['en', 'fr'] as const

export type Locale = (typeof LOCALES)[number]

/** English keeps the bare paths; every other locale is served under a prefix. */
export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
}

/** The `lang`/`hreflang` value, and the underscored form Open Graph expects. */
export const LOCALE_TAGS: Record<Locale, { html: string; openGraph: string }> = {
  en: { html: 'en', openGraph: 'en_US' },
  fr: { html: 'fr', openGraph: 'fr_FR' },
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value !== undefined && value !== null && (LOCALES as readonly string[]).includes(value)
}

/**
 * Splits a request pathname into the locale it addresses and the internal route
 * path the router should resolve. `/fr/characters` is the French rendering of
 * the `/characters` route; `/frames` is not French at all, so the prefix only
 * counts when it ends the segment.
 */
export function parsePathname(pathname: string): { locale: Locale; path: string } {
  for (const locale of LOCALES) {
    if (locale === DEFAULT_LOCALE) continue
    if (pathname === `/${locale}`) return { locale, path: '/' }
    if (pathname.startsWith(`/${locale}/`)) {
      return { locale, path: pathname.slice(locale.length + 1) }
    }
  }
  return { locale: DEFAULT_LOCALE, path: pathname }
}

/**
 * Turns an internal route path into the URL a visitor in `locale` should follow.
 * Anything that is not an app-internal path (external URLs, anchors, mailto)
 * is handed back untouched.
 */
export function localizePath(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE || !path.startsWith('/')) return path
  if (path === '/') return `/${locale}`
  return `/${locale}${path}`
}

/**
 * The same document in the other locales, for `hreflang` and the switcher. The
 * path handed in is the internal one, without any prefix.
 */
export function alternatePaths(path: string): Array<{ locale: Locale; path: string }> {
  return LOCALES.map((locale) => ({ locale, path: localizePath(path, locale) }))
}
