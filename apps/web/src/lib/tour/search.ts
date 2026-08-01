/**
 * Finding a place in the reconstruction by name.
 *
 * The ship is 301 spaces across 39 levels, and 34 of those levels are the inside
 * of a room: an index that shows one level at a time, sorted alphabetically,
 * cannot be how you find the kitchen of apartment 1004. Both the sources page
 * and the walk's finder ask the same question — *which places match what I
 * typed* — so the matching lives here rather than twice in two components.
 *
 * The rule is the plain one, with one deliberate addition: a query is cut into
 * terms and every term has to appear somewhere in the text a place offers. That
 * makes "banquet 1" and "1 banquet" both find the banquet hall on tier 1,
 * which `includes` on the whole string does not.
 */
import { deckOf, entrySpace, type Ship } from './blueprint'
import type { Provenance, Space, Tier } from './types'

/** How a place is named and sourced, in the language being read. */
export interface Naming {
  nameOf: (entity: { name: string; nameFr: string }) => string
  sourceOf: (entity: { source: string; sourceFr: string }) => string
  /** How "inside the apartment" is worded, for a space on an interior level. */
  insideOf: (room: string) => string
}

/** The query, cut into the terms every match has to satisfy. */
export function searchTerms(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

/** Whether a piece of text carries every term. An empty query matches all. */
export function matchesTerms(text: string, terms: string[]): boolean {
  if (!terms.length) return true
  const haystack = text.toLowerCase()
  return terms.every((term) => haystack.includes(term))
}

/**
 * Where a space is, said in one line: the deck, and the room it is inside when
 * it is on an interior level rather than on the deck itself.
 */
export function placeOf(ship: Ship, space: Space, words: Naming): string {
  const tier = ship.tiers.find((candidate) => candidate.id === space.tierId)
  const deck = deckOf(ship, space.tierId)
  const name = words.nameOf(deck ?? tier ?? { name: space.tierId, nameFr: space.tierId })
  return tier && tier.kind === 'interior' ? `${name} · ${words.insideOf(words.nameOf(tier))}` : name
}

/** The text a space is searched by: its name, where it is, and what backs it. */
export function textOfSpace(ship: Ship, space: Space, words: Naming): string {
  return `${words.nameOf(space)} ${placeOf(ship, space, words)} ${words.sourceOf(space)}`
}

/**
 * Spaces matching a query and an evidence rank — the room-by-room list of
 * `/tour/sources`, and the filter behind it.
 *
 * `textOf` is passed in so a caller that already has the text for other reasons
 * does not build it twice per keystroke over three hundred spaces.
 */
export function filterSpaces(
  spaces: readonly Space[],
  filter: { query: string; evidence: Provenance | 'all' },
  textOf: (space: Space) => string,
): Space[] {
  const terms = searchTerms(filter.query)
  return spaces.filter((space) => {
    if (filter.evidence !== 'all' && space.provenance !== filter.evidence) return false
    return matchesTerms(textOf(space), terms)
  })
}

/**
 * A place the finder can walk to: a space on a level, or a whole interior level
 * taken as one thing.
 *
 * An interior is offered in its own right because that is how a visitor thinks
 * of it — "apartment 1004", not "the entrance hall of 1004" — and `spaceId` is
 * then the room inside it the walk drops you in, so both kinds of result are
 * honoured the same way.
 */
export interface FoundPlace {
  kind: 'space' | 'level'
  /** Stable across results of both kinds, for keying a list. */
  id: string
  /** The space the walk should put the visitor in. */
  spaceId: string
  label: string
  place: string
  provenance: Provenance
  source: string
}

/** A name that starts with the query is what the visitor almost always meant. */
function rank(label: string, terms: string[]): number {
  if (!terms.length) return 1
  const name = label.toLowerCase()
  if (name.startsWith(terms[0])) return 0
  if (terms.every((term) => name.includes(term))) return 1
  return 2
}

/**
 * Every space and every interior level whose name, place or source carries the
 * query, best match first.
 *
 * `limit` is not a silent truncation: the finder says how many it is showing
 * out of how many matched, because "no result past the fortieth" and "forty
 * results" are different answers.
 */
/** What is being looked for, and how much of the answer the caller can show. */
export interface PlaceQuery {
  text: string
  limit?: number
}

export function findPlaces(
  ship: Ship,
  words: Naming,
  { text, limit = 40 }: PlaceQuery,
): { shown: FoundPlace[]; total: number } {
  const terms = searchTerms(text)
  const found: FoundPlace[] = []

  for (const tier of ship.tiers) {
    if (tier.kind !== 'interior') continue
    const plan = ship.plans.get(tier.id)
    if (!plan?.spaces.length) continue
    const parent = tier.parentSpaceId ? ship.spaces.get(tier.parentSpaceId) : null
    const deck = deckOf(ship, tier.id)
    const place = words.nameOf(deck ?? (tier as Tier))
    const label = words.nameOf(tier)
    const text = `${label} ${place} ${words.sourceOf(tier)} ${parent ? words.nameOf(parent) : ''}`
    if (!matchesTerms(text, terms)) continue
    found.push({
      kind: 'level',
      id: `level:${tier.id}`,
      spaceId: entrySpace(plan).id,
      label,
      place,
      provenance: tier.provenance,
      source: words.sourceOf(tier),
    })
  }

  for (const space of ship.blueprint.spaces) {
    if (!matchesTerms(textOfSpace(ship, space, words), terms)) continue
    found.push({
      kind: 'space',
      id: `space:${space.id}`,
      spaceId: space.id,
      label: words.nameOf(space),
      place: placeOf(ship, space, words),
      provenance: space.provenance,
      source: words.sourceOf(space),
    })
  }

  // A level before the rooms inside it at the same rank: asking for "1004" and
  // being handed its seven rooms before the apartment itself is backwards.
  found.sort(
    (a, b) =>
      rank(a.label, terms) - rank(b.label, terms) ||
      Number(a.kind === 'space') - Number(b.kind === 'space') ||
      a.label.localeCompare(b.label),
  )

  return { shown: found.slice(0, limit), total: found.length }
}
