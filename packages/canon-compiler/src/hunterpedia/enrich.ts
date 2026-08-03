import { GENERATED_PASSENGER_DESCRIPTION } from '../map/duplicates.js'
import type { WritableCharacter } from './catalogue-file.js'
import { findDebutChapter, findFaction, findPost, PRINCE_ROOM, type Infobox } from './infobox.js'

/**
 * Replacing `sync`'s placeholders with what the infobox actually says.
 *
 * A field is written only while it still holds a placeholder. Entries written
 * by hand are never overwritten, which is what makes this safe to rerun over a
 * catalogue that is half curated and half imported.
 */

const PLACEHOLDER_ROLES: ReadonlySet<string> = new Set([
  'passager nommé',
  'divers',
  'personnel',
  'annonceur',
  '',
])
const PLACEHOLDER_CHAPTERS: ReadonlySet<string> = new Set(['ch-359', 'ch-unknown'])

/** Entries that still look like a template rather than a reading. */
export function enrichmentTargets(catalogue: readonly WritableCharacter[]): WritableCharacter[] {
  return catalogue.filter(
    (entry) =>
      !entry.factionId &&
      (entry.description === GENERATED_PASSENGER_DESCRIPTION ||
        PLACEHOLDER_CHAPTERS.has(entry.firstAppearanceChapterId ?? '') ||
        PLACEHOLDER_ROLES.has(entry.shipLocation?.role ?? '')),
  )
}

function enrichPosition(entry: WritableCharacter, infobox: Infobox, post: string | null): string[] {
  const location = entry.shipLocation
  if (!location) return []
  const changes: string[] = []

  if (post && location.tier == null && location.room == null) {
    location.tier = 1
    location.room = PRINCE_ROOM[post] ?? null
    changes.push(`room=${location.room} (${post})`)
    // A post known only from Togashi's sheets is dated by no panel: the map
    // will place it at boarding, so PROBABLE rather than CONFIRMED.
    if (infobox.databookOnly) {
      entry.positionProvenance = 'databook'
      changes.push('positionProvenance=databook')
    }
  }
  if (infobox.occupation && PLACEHOLDER_ROLES.has(location.role)) {
    location.role = infobox.occupation
    changes.push('role')
  }
  if (location.status === 'inconnu') {
    location.status = infobox.deceased ? 'mort' : post ? 'actif' : 'inconnu'
    if (location.status !== 'inconnu') changes.push(`status=${location.status}`)
  }
  return changes
}

function enrichDebut(entry: WritableCharacter, infobox: Infobox): string[] {
  if (!PLACEHOLDER_CHAPTERS.has(entry.firstAppearanceChapterId ?? '')) return []

  const chapter = findDebutChapter(infobox.debut)
  if (chapter) {
    entry.firstAppearanceChapterId = `ch-${chapter}`
    entry.mapPresenceFromChapterId = `ch-${chapter}`
    return [`debut=ch-${chapter}`]
  }
  if (infobox.databookOnly) {
    // Never on panel: do not invent a chapter. The spoiler cap reads this, and
    // canon-lint accepts the gap only for a databook entry.
    entry.firstAppearanceChapterId = null
    entry.mapPresenceFromChapterId = null
    return ['debut=null (databook)']
  }
  return []
}

export interface EnrichOutcome {
  changes: string[]
  factionResolved: boolean
  databookOnly: boolean
}

/** Rewrite one entry in place; returns what moved and why. */
export function enrichCharacter(entry: WritableCharacter, infobox: Infobox): EnrichOutcome {
  const post = findPost(infobox.occupation)
  const faction = findFaction({
    affiliation: infobox.affiliation,
    occupation: infobox.occupation,
    post,
  })
  const changes: string[] = []

  if (!entry.factionId && faction) {
    entry.factionId = faction
    changes.push(`factionId=${faction}`)
  }

  changes.push(...enrichPosition(entry, infobox, post))
  changes.push(...enrichDebut(entry, infobox))

  if (entry.description === GENERATED_PASSENGER_DESCRIPTION) {
    const origin = infobox.databookOnly
      ? ' Révélé dans les fiches de Togashi (Jump Ryu! Vol. 21), sans apparition dans le manga.'
      : ''
    entry.description = `${[infobox.occupation, infobox.affiliation].filter(Boolean).join('. ')}.${origin}`
    changes.push('description')
  }

  return { changes, factionResolved: faction !== null, databookOnly: infobox.databookOnly }
}
