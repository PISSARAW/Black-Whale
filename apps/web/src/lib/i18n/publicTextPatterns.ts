import type { Locale } from './config'

export const textKey = (value: string): string => value.replace(/\s+/g, ' ').trim()
export const textEntry = (table: Readonly<Record<string, string>>, key: string) =>
  Object.hasOwn(table, key) ? table[key] : undefined

const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function textPatterns(table: Readonly<Record<string, string>>) {
  return Object.entries(table)
    .filter(([source]) => source.includes('ZXARG'))
    .map(([source, target]) => ({
      pattern: new RegExp(
        `^${source
          .split(/ZXARG\d+ZX/)
          .map(escapePattern)
          .join('(.*?)')}$`,
        'i',
      ),
      target,
    }))
}

export function matchTextPattern(
  text: string,
  patterns: ReturnType<typeof textPatterns>,
  translateArgument: (value: string) => string = (value) => value,
): string | null {
  for (const { pattern, target } of patterns) {
    const match = text.match(pattern)
    if (match)
      return target.replace(/ZXARG(\d+)ZX/g, (_, index) =>
        translateArgument(match[Number(index) + 1] ?? ''),
      )
  }
  return null
}

const weekdays = [
  ['Sunday', 'dimanche'],
  ['Monday', 'lundi'],
  ['Tuesday', 'mardi'],
  ['Wednesday', 'mercredi'],
  ['Thursday', 'jeudi'],
  ['Friday', 'vendredi'],
  ['Saturday', 'samedi'],
] as const

export function localizedVoyageLabel(text: string, locale: Locale): string {
  if (!/^(?:≈\s*)?(?:Day|Jour)\s+\d/i.test(text)) return text
  let result =
    locale === 'fr'
      ? text.replace(/\bDay\s+(\d+)/g, 'Jour $1')
      : text.replace(/\bJour\s+(\d+)/gi, 'Day $1')
  for (const [english, french] of weekdays) {
    result =
      locale === 'fr'
        ? result.replace(new RegExp(`\\b${english}\\b`, 'g'), french)
        : result.replace(new RegExp(`\\b${french}\\b`, 'gi'), english)
  }
  return result
}
