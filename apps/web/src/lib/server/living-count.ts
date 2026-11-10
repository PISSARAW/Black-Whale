import { isVisibleAtSpoilerLimit } from './character-profile'

/**
 * How many of the catalogued characters are still alive, as a reader stopped at
 * a given chapter knows it.
 *
 * This counts the characters the archive follows, never the ship's 200,000
 * passengers: canon gives no death toll for them, and a number made up for the
 * homepage would be the one figure on the site with no source.
 *
 * A death only counts once the reader has reached the chapter that shows it.
 * Without that, the counter would be a spoiler on the front page.
 */

/** The fields of a catalogue entry this count reads. */
export interface LivingCountCharacter {
  firstAppearanceChapterId?: string | null
  shipLocation?: { status?: string } | null
  mangaAppearances?: ReadonlyArray<{ chapter: number; status: string }>
  mapPresenceUntilChapterId?: string | null
}

export interface LivingCount {
  /** Characters the reader has met and has not seen die. */
  alive: number
  /** Characters whose death the reader has reached. */
  dead: number
  /** Characters the catalogue itself cannot place among the living or the dead. */
  unknown: number
  /** Every character the reader has met: the three above add up to it. */
  total: number
}

/** French and English, because the catalogue was authored in both. */
const DEAD_STATUS = /^(mort|morte|decede|decedee|décédé|décédée|dead|deceased)$/i
const UNKNOWN_STATUS = /^(inconnu|inconnue|unknown)$/i

/** Statuses that put the body on panel: a `death` followed by one is no death. */
const PRESENT_STATUSES: ReadonlySet<string> = new Set(['appears', 'debut', 'disguised', 'death'])

function parseChapterId(id: string | null | undefined): number | null {
  const match = /^ch-(\d+)/.exec(id ?? '')
  return match ? Number.parseInt(match[1], 10) : null
}

/**
 * The chapter a reader learns of the death, read from the panels: the last
 * `death` the character is not seen alive after, or else the first `corpse`.
 * Same rule as `deathChapter` in the canon compiler, which the web app does
 * not depend on.
 */
function panelDeathChapter(appearances: LivingCountCharacter['mangaAppearances']): number | null {
  const entries = appearances ?? []
  const death = [...entries].reverse().find((entry) => entry.status === 'death')
  if (death) {
    const returnsLater = entries.some(
      (entry) => entry.chapter > death.chapter && PRESENT_STATUSES.has(entry.status),
    )
    if (!returnsLater) return death.chapter
  }
  return entries.find((entry) => entry.status === 'corpse')?.chapter ?? null
}

/**
 * When the reader learns of the death: a chapter, `Infinity` when the catalogue
 * says the character is dead without dating it, or null when they are not dead.
 *
 * An undated death is only revealed to a reader with no cap. Showing it to a
 * capped reader would guess at a chapter the data never states.
 */
function deathRevealedAt(character: LivingCountCharacter): number | null {
  const fromPanels = panelDeathChapter(character.mangaAppearances)
  if (fromPanels !== null) return fromPanels
  if (!DEAD_STATUS.test(character.shipLocation?.status ?? '')) return null
  return parseChapterId(character.mapPresenceUntilChapterId) ?? Number.POSITIVE_INFINITY
}

type Fate = 'alive' | 'dead' | 'unknown'

function fateAt(character: LivingCountCharacter, spoilerLimit: number | undefined): Fate {
  const death = deathRevealedAt(character)
  if (death !== null && (spoilerLimit === undefined || death <= spoilerLimit)) return 'dead'
  if (death === null && UNKNOWN_STATUS.test(character.shipLocation?.status ?? '')) return 'unknown'
  return 'alive'
}

export function countLiving(
  characters: ReadonlyArray<LivingCountCharacter>,
  spoilerLimit?: number,
): LivingCount {
  const count: LivingCount = { alive: 0, dead: 0, unknown: 0, total: 0 }
  for (const character of characters) {
    if (!isVisibleAtSpoilerLimit(character, spoilerLimit)) continue
    count[fateAt(character, spoilerLimit)] += 1
    count.total += 1
  }
  return count
}
