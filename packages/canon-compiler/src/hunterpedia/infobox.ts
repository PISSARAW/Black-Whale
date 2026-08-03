import { infoboxField, stripWikitext } from './wikitext.js'

/**
 * Reading a passenger's infobox for the three things the catalogue needs:
 * who employs them, where they are posted, and when they first appear.
 *
 * The distinction between the first two is the point. Saquelle is Benjamin's
 * private soldier — so `factionId: prince-benjamin` — but a royal guard to
 * Marayam, so he stands in room 1013. Conflating them put a dozen soldiers in
 * their employer's apartment instead of the one they guard.
 */

/** Royal residential sector, Tier 1: one room per prince, in order of birth. */
export const PRINCE_ROOM: Readonly<Record<string, string>> = {
  Benjamin: '1001',
  Camilla: '1002',
  'Zhang Lei': '1003',
  Tserriednich: '1004',
  Tubeppa: '1005',
  Tyson: '1006',
  Luzurus: '1007',
  'Salé-salé': '1008',
  Halkenburg: '1009',
  Kacho: '1010',
  Fugetsu: '1011',
  Momoze: '1012',
  Marayam: '1013',
  Woble: '1014',
}

const PRINCE_FACTION: Readonly<Record<string, string>> = {
  Benjamin: 'prince-benjamin',
  Camilla: 'prince-camilla',
  'Zhang Lei': 'prince-zhanglei',
  Tserriednich: 'prince-tserriednich',
  Tubeppa: 'prince-tubeppa',
  Tyson: 'prince-tyson',
  Luzurus: 'prince-luzurus',
  'Salé-salé': 'prince-salesale',
  Halkenburg: 'prince-halkenburg',
  Kacho: 'prince-kacho',
  Fugetsu: 'prince-fugetsu',
  Momoze: 'prince-momoze',
  Marayam: 'prince-marayam',
  Woble: 'prince-woble',
}

const MAFIA_FACTION: Readonly<Record<string, string>> = {
  'Heil-Ly Family': 'mafia-heilly',
  'Xi-Yu Family': 'mafia-xiyu',
  'Cha-R Family': 'mafia-char',
}

const PRINCES = Object.keys(PRINCE_ROOM)

/** Clauses naming the POST — where the person stands — not their employer. */
const POST_PATTERNS: readonly RegExp[] = [
  /(?:Royal )?Bodyguard (?:for|of|to) (?:Prince(?:ss)? )?([A-Za-zé\- ]+)/i,
  /assigned to Prince ([A-Za-zé\- ]+)/i,
  /(?:Private Guard|Majordomo|Captain of the Private Guards) of Prince ([A-Za-zé\- ]+)/i,
  /Prince ([A-Za-zé\- ]+?)'s (?:Maid|Servant)/i,
  /(?:Captain of the Guards|Personal Soldier|Private Soldier|Private Military Commander|Servant|Researcher) for Prince ([A-Za-zé\- ]+)/i,
]

export interface Infobox {
  affiliation: string
  occupation: string
  debut: string
  deceased: boolean
  /** Togashi's Jump Ryu! Vol. 21 sheets: named, never drawn in the manga. */
  databookOnly: boolean
}

export function readInfobox(wikitext: string): Infobox {
  // A dead character's page moves to the "previous" fields.
  const affiliation = stripWikitext(
    infoboxField(wikitext, 'affiliation') || infoboxField(wikitext, 'previous affiliation'),
  )
  const occupation = stripWikitext(
    infoboxField(wikitext, 'occupation') || infoboxField(wikitext, 'previous occupation'),
  )
  const debut = stripWikitext(infoboxField(wikitext, 'manga debut'))
  return {
    affiliation,
    occupation,
    debut,
    deceased: /Deceased/i.test(stripWikitext(infoboxField(wikitext, 'status'))),
    databookOnly: !debut && /Jump ?Ryu/i.test(wikitext),
  }
}

/** The prince this person is stationed with, which decides their room. */
export function findPost(occupation: string): string | null {
  for (const pattern of POST_PATTERNS) {
    for (const clause of occupation.split(' ; ')) {
      const match = pattern.exec(clause)
      const name = match?.[1]?.trim()
      const prince = name ? PRINCES.find((candidate) => name.startsWith(candidate)) : undefined
      if (prince) return prince
    }
  }
  return null
}

export interface Employment {
  affiliation: string
  occupation: string
  /** The prince they guard, so the employer can be told apart from the post. */
  post: string | null
}

export function findFaction({ affiliation, occupation, post }: Employment): string | null {
  const mafiaName = Object.keys(MAFIA_FACTION).find((family) => affiliation.includes(family))
  // A mafia officer seconded to a prince stays attached to their family.
  if (mafiaName && /\b(Boss|Mafioso|Consigliere)\b/i.test(occupation)) {
    return MAFIA_FACTION[mafiaName] ?? null
  }
  const affiliated = PRINCES.filter((prince) => new RegExp(`\\b${prince}\\b`).test(affiliation))
  const employer = affiliated.find((prince) => prince !== post) ?? affiliated[0]
  if (employer) return PRINCE_FACTION[employer] ?? null
  if (mafiaName) return MAFIA_FACTION[mafiaName] ?? null
  if (/Phantom Troupe/.test(affiliation)) return 'phantom-troupe'
  if (/Zodiacs?/.test(affiliation)) return 'zodiacs'
  if (/Royal Army/.test(affiliation)) return 'kakin-royal-army'
  if (/Hui Guo Rou|Kakin Empire/.test(affiliation)) return 'kakin-royal-family'
  if (/Hunter Association/.test(affiliation)) return 'hunter-association'
  return null
}

/** Prefers a chapter the character is actually shown in, not merely named in. */
export function findDebutChapter(debut: string): number | null {
  const parsed = debut
    .split(' ; ')
    .filter(Boolean)
    .map((clause) => {
      const match = /Chapter (\d+)/.exec(clause)
      return match?.[1]
        ? { chapter: Number(match[1]), mentionOnly: /Mentioned/i.test(clause) }
        : null
    })
    .filter((entry): entry is { chapter: number; mentionOnly: boolean } => entry !== null)

  const shown = parsed.find((entry) => !entry.mentionOnly) ?? parsed[0]
  return shown?.chapter ?? null
}
