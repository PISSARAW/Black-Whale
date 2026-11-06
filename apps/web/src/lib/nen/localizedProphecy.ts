import { parsePathname, type Locale } from '$lib/i18n/config'
import { publicText } from '$lib/i18n/publicText'
import type { ProphecySheet } from './prophecySheets'

let texts: Record<Locale, Record<string, string>> = { en: {}, fr: {} }

/** Load alongside the original on-demand poems, rather than in the main bundle. */
export async function loadPoemTranslations(): Promise<void> {
  texts = (await import('../i18n/messages/public-poems.json')).default
}

export function localizedProphecy(sheet: ProphecySheet | null, pathname: string) {
  if (!sheet) return null
  const { locale } = parsePathname(pathname)
  return {
    ...sheet,
    poem: sheet.poem.map((line) => publicText(line, locale, texts[locale])),
    foretells: publicText(sheet.foretells, locale, texts[locale]),
  }
}
