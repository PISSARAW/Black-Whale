import contentTexts from './public-content.json'
import { parsePathname, type Locale } from '$lib/i18n/config'
import { matchTextPattern, textEntry, textKey, textPatterns } from '$lib/i18n/publicTextPatterns'
import { publicText } from '$lib/i18n/publicText'

const dictionaries: Record<Locale, Readonly<Record<string, string>>> = contentTexts

/** Only texts already present in the spoiler-filtered response reach the browser. */
export function pageTranslations(
  data: unknown,
  locale: Locale,
  dictionary = dictionaries[locale],
): Record<string, string> {
  const result: Record<string, string> = {}
  const patterns = textPatterns(dictionary)
  const seen = new WeakSet<object>()
  const visit = (value: unknown): void => {
    if (typeof value === 'string') {
      const source = textKey(value)
      const target =
        textEntry(dictionary, source) ??
        matchTextPattern(source, patterns, (argument) => publicText(argument, locale, dictionary))
      if (target !== null && target !== source) result[source] = target
      return
    }
    if (!value || typeof value !== 'object' || seen.has(value)) return
    seen.add(value)
    for (const child of Object.values(value)) visit(child)
  }
  visit(data)
  return result
}

/** Add a view dictionary after filtering, without translating identifiers or model fields. */
export function localizedLoad<Load extends (...args: never[]) => unknown>(load: Load): Load {
  const localized = async (event: Parameters<Load>[0]) => {
    const data = await load(event as never)
    if (!data || typeof data !== 'object') return data
    const url = (event as { url?: URL }).url
    const { locale } = parsePathname(url?.pathname ?? '/')
    const localizedContent = pageTranslations(data, locale)
    return Object.keys(localizedContent).length ? { ...data, localizedContent } : data
  }
  return localized as Load
}
