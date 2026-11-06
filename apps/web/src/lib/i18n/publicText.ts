import uiTexts from './messages/public-ui.json'
import type { Locale } from './config'
import {
  localizedVoyageLabel,
  matchTextPattern,
  textEntry,
  textKey,
  textPatterns,
} from './publicTextPatterns'

type TextTable = Readonly<Record<string, string>>
const metadataTextFields = new Set(['name', 'description', 'headline', 'text', 'alternateName'])
const dictionaries: Record<Locale, TextTable> = uiTexts
const patterns = { en: textPatterns(dictionaries.en), fr: textPatterns(dictionaries.fr) }
const capitals = Object.fromEntries(
  Object.entries(dictionaries).map(([locale, table]) => [
    locale,
    Object.fromEntries(
      Object.entries(table).map(([source, target]) => [
        source.toLocaleUpperCase(locale),
        target.toLocaleUpperCase(locale),
      ]),
    ),
  ]),
) as Record<Locale, TextTable>

function capitalText(text: string, locale: Locale, content: TextTable): string | null {
  if (text.length < 2 || text !== text.toLocaleUpperCase(locale)) return null
  const entry = Object.entries(content).find(
    ([source]) => source.toLocaleUpperCase(locale) === text,
  )
  return entry?.[1].toLocaleUpperCase(locale) ?? textEntry(capitals[locale], text) ?? null
}

function joinedText(text: string, locale: Locale, content: TextTable): string | null {
  const parts = text.split(/(\s*[→·—]\s+)/)
  if (parts.length < 3) return null
  const result = parts
    .map((part, index) => (index % 2 ? part : (lookup(part, locale, content) ?? part)))
    .join('')
  return result === text ? null : result
}

function pageExcerpt(text: string, content: TextTable): string | null {
  if (!/[.…]$/.test(text)) return null
  const prefix = text.replace(/[.…]+$/, '').trim()
  if (prefix.length < 40) return null
  const entry = Object.entries(content).find(([source]) => source.startsWith(prefix))
  return entry ? `${entry[1].slice(0, prefix.length).replace(/\s+\S*$/, '')}…` : null
}

function lookup(text: string, locale: Locale, content: TextTable): string | null {
  const key = textKey(text)
  const exact = textEntry(content, key) ?? textEntry(dictionaries[locale], key)
  if (exact !== undefined) return exact
  const pattern = matchTextPattern(
    key,
    patterns[locale],
    (argument) =>
      textEntry(content, argument) ?? textEntry(dictionaries[locale], argument) ?? argument,
  )
  if (pattern !== null) return pattern
  const excerpt = pageExcerpt(key, content)
  if (excerpt !== null) return excerpt
  const voyageLabel = localizedVoyageLabel(key, locale)
  if (voyageLabel !== key) return voyageLabel
  return capitalText(key, locale, content) ?? joinedText(key, locale, content)
}

/** Translate presentation text; values used by the narrative engine stay untouched. */
export function publicText<T>(value: T, locale: Locale, content: TextTable = {}): T {
  if (typeof value !== 'string' || !value.trim()) return value
  const translated = lookup(value, locale, content)
  if (translated === null) return value
  const result = `${value.match(/^\s*/)?.[0] ?? ''}${translated}${value.match(/\s*$/)?.[0] ?? ''}`
  return result as T
}

/** A translated copy for structured presentation metadata, never for application state. */
export function publicMetadata<T>(value: T, locale: Locale, content: TextTable = {}): T {
  if (typeof value === 'string') return publicText(value, locale, content)
  if (Array.isArray(value)) return value.map((item) => publicMetadata(item, locale, content)) as T
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        typeof child === 'string' && !metadataTextFields.has(key)
          ? child
          : publicMetadata(child, locale, content),
      ]),
    ) as T
  }
  return value
}
