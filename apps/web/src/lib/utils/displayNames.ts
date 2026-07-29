import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/config'

// Part of the catalogue was written in French, so these helpers anglicised it on
// the way to the screen. With a French rendering of the site that source form is
// the correct one, so each helper takes the locale and only rewrites for English.

const englishNameOverrides: Record<string, string> = {
  "Neveu d'Oito": "Oito's Nephew",
  'Utilisateur de Silent Majority': 'Silent Majority User',
}

export function displayName(name: string | null | undefined, locale: Locale = DEFAULT_LOCALE) {
  if (!name) return ''
  if (locale !== DEFAULT_LOCALE) return name
  return englishNameOverrides[name] || name
}

function ordinal(value: number) {
  const lastTwo = value % 100
  if (lastTwo >= 11 && lastTwo <= 13) return `${value}th`
  if (value % 10 === 1) return `${value}st`
  if (value % 10 === 2) return `${value}nd`
  if (value % 10 === 3) return `${value}rd`
  return `${value}th`
}

export function aliasLabel(alias: string, locale: Locale = DEFAULT_LOCALE) {
  if (locale !== DEFAULT_LOCALE) return alias
  const prince = alias.match(/^(\d+)(?:er|e|ème)\s+Prince$/i)
  return prince ? `${ordinal(Number(prince[1]))} Prince` : displayName(alias, locale)
}

export function conflictLabel(label: string, locale: Locale = DEFAULT_LOCALE) {
  if (locale !== DEFAULT_LOCALE) return label
  return label.replace(/\s+contre\s+/gi, ' vs. ').replace(/\s+et\s+/gi, ' and ')
}

/**
 * The trajectory engine writes this sentinel in French for a position canon
 * never depicts, and it is compared against by value elsewhere — so it is
 * rendered through here rather than rewritten at the source.
 */
const UNKNOWN_POSITION = 'Position inconnue'

export function locationLabel(location: string, locale: Locale = DEFAULT_LOCALE) {
  if (locale !== DEFAULT_LOCALE) return location
  return location === UNKNOWN_POSITION ? 'Unknown position' : location
}

export function eventTitle(title: string, locale: Locale = DEFAULT_LOCALE) {
  if (locale !== DEFAULT_LOCALE) return title
  return title.replace(/^Début du chapitre\s+(\d+)$/i, 'Start of Chapter $1')
}
