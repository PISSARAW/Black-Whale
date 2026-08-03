import type { AppearanceStatus } from '@black-whale/contracts'

/**
 * Reading Hunterpedia's markup.
 *
 * Everything here is a pure string transformation, which is the whole reason
 * this file exists apart from the fetching: the wiki's conventions are the part
 * that keeps being wrong, and they can be checked against a fixture instead of
 * against the live site.
 */

/** Names as a key: no accents, no punctuation, no case. */
export function normalizeName(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/gi, '')
      .toLowerCase()
      // The wiki spells Hisoka's surname both ways and the catalogue picked one.
      .replace('morow', 'morrow')
  )
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * One field of an infobox template.
 *
 * Horizontal whitespace only: `\s*` would swallow the newline, and an empty
 * field would capture the template's next line as its value.
 */
export function infoboxField(wikitext: string, key: string): string {
  const match = new RegExp(`^\\|[ \\t]*${key}[ \\t]*=[ \\t]*(.*)$`, 'mi').exec(wikitext)
  return match?.[1]?.trim() ?? ''
}

/** Markup down to the sentence it was hiding. */
export function stripWikitext(value: string): string {
  return value
    .replace(/<ref[^>]*>.*?<\/ref>/gis, '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/<br\s*\/?>/gi, ' ; ')
    .replace(/<[^>]*>/g, '')
    .replace(/'''?/g, '')
    .replace(/\}\}/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*;\s*$/, '')
    .trim()
}

/** One entry of a chapter's cast list: a link, some markers, maybe a note. */
export interface AppearanceEntry {
  name: string
  flags: string[]
  note: string
}

export function parseAppearanceList(wikitext: string): AppearanceEntry[] {
  const start = wikitext.search(/==\s*Characters in Order of Appearance\s*==/i)
  if (start < 0) return []
  const section = wikitext.slice(start).split(/\n==[^=]/)[0] ?? ''

  const entries: AppearanceEntry[] = []
  for (const line of section.split('\n')) {
    const match = /^\*+\s*\[\[([^\]|]+)(?:\|[^\]]*)?\]\]\s*(.*)$/.exec(line)
    if (!match?.[1]) continue
    const trailer = match[2] ?? ''
    entries.push({
      name: match[1].trim(),
      flags: [...trailer.matchAll(/\{\{([A-Za-z]+)\}\}/g)].map((found) => found[1] ?? ''),
      note: [...trailer.matchAll(/\{\{Sm\|\(([^)]*)/g)].map((found) => found[1] ?? '').join(' ; '),
    })
  }
  return entries
}

export function chapterTitle(wikitext: string): string | null {
  const match = /^\|\s*Name\s*=\s*(.*)$/m.exec(wikitext)
  return match?.[1]?.trim() ?? null
}

/**
 * What an entry's markers say the character was doing.
 *
 * Hunterpedia's markers: `{{D}}` debut, `{{M}}`/`{{Mi}}` mention, `{{I}}`
 * image, `{{F}}` flashback, `{{Co}}` corpse, `{{V}}` video. The order matters —
 * a character who debuts in a flashback is a debut first, and an image that is
 * mentioned stays an image.
 */
export function statusFor({ flags, note }: AppearanceEntry): AppearanceStatus {
  const has = (flag: string) => flags.includes(flag)
  if (/Disguised as/i.test(note)) return 'disguised'
  if (/Nen Double/i.test(note)) return 'clone'
  if (/Vision/i.test(note)) return 'vision'
  if (has('Co') || /Corpse|Casket/i.test(note)) return 'corpse'
  if (has('D')) return 'debut'
  if (has('F') || /Flashback/i.test(note)) return 'flashback'
  if (has('V') || /Video/i.test(note)) return 'voice'
  if (has('I') || /Image|Photo|Cover|Silhouette|diagram/i.test(note)) return 'pictured'
  if (has('M') || has('Mi') || /Mentioned/i.test(note)) return 'mentioned'
  return 'appears'
}
