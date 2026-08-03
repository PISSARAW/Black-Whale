import { GENERATED_PASSENGER_DESCRIPTION } from '../map/duplicates.js'
import type { WritableCharacter } from './catalogue-file.js'
import { normalizeName, slugify } from './wikitext.js'

/**
 * Adding the Black Whale passengers the catalogue does not list yet.
 *
 * What this writes is a TEMPLATE, and the placeholders are deliberate: a null
 * faction, `ch-359`, an empty position. They are not observations of the manga,
 * and `enrich` is what replaces them with the infobox's answers. Running this
 * without running that leaves two hundred passengers standing nowhere,
 * boarding on the same day.
 */

export const CATEGORY = 'Category:Black Whale 1 Passengers'

export interface SyncResult {
  additions: WritableCharacter[]
  catalogue: WritableCharacter[]
}

/** A template entry for a passenger the catalogue has never heard of. */
function template(id: string, canonicalName: string): WritableCharacter {
  return {
    id,
    canonicalName,
    aliases: [],
    description: GENERATED_PASSENGER_DESCRIPTION,
    factionId: null,
    firstAppearanceChapterId: 'ch-359',
    canonStatus: 'canon',
    shipLocation: { tier: null, room: null, status: 'inconnu', role: 'passager nommé' },
    mapPresenceFromChapterId: 'ch-359',
    mapPresenceUntilChapterId: null,
    mangaAppearances: [],
  }
}

/**
 * The catalogue plus whoever the category names and it does not hold.
 *
 * Matching is on every name an entry answers to — canonical and aliases —
 * normalised, because the wiki and the catalogue disagree about accents and
 * about whether Hisoka's surname has two Rs.
 */
export function addMissingPassengers(
  catalogue: readonly WritableCharacter[],
  passengerNames: readonly string[],
): SyncResult {
  const known = new Set(
    catalogue
      .flatMap((entry) => [entry.canonicalName, ...(entry.aliases ?? [])])
      .map(normalizeName),
  )
  const takenIds = new Set(catalogue.map((entry) => entry.id))
  const additions: WritableCharacter[] = []

  for (const canonicalName of passengerNames) {
    if (known.has(normalizeName(canonicalName))) continue
    const base = slugify(canonicalName)
    let id = base
    let suffix = 2
    while (takenIds.has(id)) id = `${base}-${suffix++}`

    takenIds.add(id)
    known.add(normalizeName(canonicalName))
    additions.push(template(id, canonicalName))
  }

  const merged = [
    ...catalogue,
    ...[...additions].sort((left, right) => left.canonicalName.localeCompare(right.canonicalName)),
  ]
  return { additions, catalogue: additions.length ? merged : [...catalogue] }
}
