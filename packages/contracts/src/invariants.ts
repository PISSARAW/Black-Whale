import type { Blueprint } from './schemas.js'
import type { Catalogue, Finding } from './types.js'

/**
 * The rules no single file can state.
 *
 * A schema says what one entry looks like. These say what the archive means:
 * that a reference points at something, that a source is never weaker than the
 * thing it sits inside, that the reader's spoiler cap can actually be applied.
 * ADR-001 calls this the contract before the data; it is the half that makes
 * the three families of defect found in the audit non-reproducible.
 */

type Invariant = (catalogue: Catalogue) => Finding[]

function finding(rule: string, where: string, message: string): Finding {
  return { rule, where, message }
}

/** Every `id` in a file is used once. A duplicate silently wins or loses. */
const uniqueIds: Invariant = ({ characters, abilities, factions, locations, chapters }) => {
  const findings: Finding[] = []
  const check = (file: string, ids: readonly string[]) => {
    const seen = new Set<string>()
    for (const id of ids) {
      if (seen.has(id)) findings.push(finding('unique-ids', `${file}#${id}`, 'duplicate id'))
      seen.add(id)
    }
  }
  check(
    'characters',
    characters.map((entry) => entry.id),
  )
  check(
    'abilities',
    abilities.map((entry) => entry.id),
  )
  check(
    'factions',
    factions.map((entry) => entry.id),
  )
  check(
    'locations',
    locations.map((entry) => entry.id),
  )
  check(
    'chapters',
    chapters.map((entry) => entry.id),
  )
  return findings
}

/** One reference to check, named so the report can point at it. */
interface Reference {
  rule: string
  where: string
  value: string | null | undefined
  known: ReadonlySet<string>
}

/** Anything naming a character, faction or chapter names one that exists. */
const referencesResolve: Invariant = (catalogue) => {
  const findings: Finding[] = []
  const characterIds = new Set(catalogue.characters.map((entry) => entry.id))
  const factionIds = new Set(catalogue.factions.map((entry) => entry.id))
  const locationIds = new Set(catalogue.locations.map((entry) => entry.id))

  const ref = ({ rule, where, value, known }: Reference) => {
    if (value && !known.has(value))
      findings.push(finding(rule, where, `unknown reference ${value}`))
  }

  for (const character of catalogue.characters) {
    ref({
      rule: 'character-faction',
      where: `characters#${character.id}`,
      value: character.factionId,
      known: factionIds,
    })
  }
  for (const ability of catalogue.abilities) {
    // The owner is the one reference the site cannot do without: `/abilities`
    // dates a technique by its owner's first appearance.
    ref({
      rule: 'ability-owner',
      where: `abilities#${ability.id}`,
      value: ability.ownerId,
      known: characterIds,
    })
    for (const userId of ability.userIds ?? []) {
      ref({
        rule: 'ability-user',
        where: `abilities#${ability.id}`,
        value: userId,
        known: characterIds,
      })
    }
  }
  for (const prophecy of catalogue.prophecies) {
    ref({
      rule: 'prophecy-subject',
      where: `prophecies#${prophecy.id}`,
      value: prophecy.subjectId,
      known: characterIds,
    })
    ref({
      rule: 'prophecy-faction',
      where: `prophecies#${prophecy.id}`,
      value: prophecy.factionId,
      known: factionIds,
    })
  }
  for (const location of catalogue.locations) {
    ref({
      rule: 'location-parent',
      where: `locations#${location.id}`,
      value: location.parentLocationId,
      known: locationIds,
    })
  }
  return findings
}

/**
 * Chapter references name a chapter of this arc.
 *
 * `chapters/chapters.json` holds the chapters the archive *details*, not every
 * chapter that exists, so membership in it proves nothing. What can be checked
 * is the form and the span: a reference is `ch-<number>` — or the explicit
 * `ch-unknown` — and a number inside the arc the archive covers.
 */
const chapterReferencesAreWellFormed: Invariant = ({ characters, abilities, chapters }) => {
  const findings: Finding[] = []
  const numbers = chapters.map((chapter) => chapter.number)
  const last = Math.max(...numbers)

  const check = (where: string, value: string | null | undefined) => {
    if (!value || value === 'ch-unknown') return
    const match = /^ch-(\d+)$/.exec(value)
    if (!match) {
      findings.push(finding('chapter-reference', where, `${value} is not ch-<number>`))
      return
    }
    if (Number(match[1]) > last) {
      findings.push(
        finding('chapter-reference', where, `${value} is past the last catalogued chapter ${last}`),
      )
    }
  }

  for (const character of characters) {
    check(`characters#${character.id}`, character.firstAppearanceChapterId)
  }
  for (const ability of abilities) {
    check(`abilities#${ability.id}`, ability.firstVisibleChapterId)
  }
  return findings
}

/** Two events cannot claim the same place in the story, and none sits outside it. */
const eventsAreOrdered: Invariant = ({ events, chapters }) => {
  const findings: Finding[] = []
  const numbers = chapters.map((chapter) => chapter.number)
  const first = Math.min(...numbers)
  const last = Math.max(...numbers)
  const positions = new Set<string>()

  for (const event of events) {
    if (event.chapter < first || event.chapter > last) {
      findings.push(
        finding(
          'event-chapter',
          `events#${event.title}`,
          `chapter ${event.chapter} is outside the arc the archive covers (${first}-${last})`,
        ),
      )
    }
    const position = `${event.chapter}:${event.sequence}`
    if (positions.has(position)) {
      findings.push(
        finding('event-order', `events#${event.title}`, `two events claim position ${position}`),
      )
    }
    positions.add(position)
  }
  return findings
}

/**
 * Anything ranked above `inferred` says where it comes from.
 *
 * The authority ladder in `data/ship/README.md` is not about containment — a
 * room drawn on a panel may well sit in a deck that is only inferred, and the
 * README says so. What the ladder does forbid is a claim that outranks
 * `inferred` without a citation: the rank *is* the citation's weight, so a
 * `panel` with no source is a rank asserted rather than earned.
 */
const rankedClaimsCiteASource: Invariant = ({ blueprint }) => {
  const findings: Finding[] = []
  const cited = (value: unknown) => typeof value === 'string' && value.trim().length > 0

  for (const space of blueprint.spaces) {
    if (space.provenance !== 'inferred' && !cited(space.source)) {
      findings.push(
        finding('provenance-source', `ship#${space.id}`, `${space.provenance} with no source`),
      )
    }
  }
  for (const structure of blueprint.structures) {
    const source = (structure as { source?: unknown }).source
    if (structure.provenance !== 'inferred' && !cited(source)) {
      findings.push(
        finding(
          'provenance-source',
          `ship#${structure.id}`,
          `${structure.provenance} with no source`,
        ),
      )
    }
  }
  return findings
}

/** Every space stands on a deck the blueprint declares. */
const spacesStandOnADeck: Invariant = ({ blueprint }) => {
  const tierIds = new Set(blueprint.tiers.map((tier) => tier.id))
  return blueprint.spaces
    .filter((space) => !tierIds.has(space.tierId))
    .map((space) => finding('ship-space-tier', `ship#${space.id}`, `unknown tier ${space.tierId}`))
}

/** A door has to join two spaces that exist, and not a space to itself. */
const linksJoinRealSpaces: Invariant = ({ blueprint }) => {
  const findings: Finding[] = []
  const spaceIds = new Set(blueprint.spaces.map((space) => space.id))
  for (const link of blueprint.links) {
    for (const end of [link.from, link.to]) {
      if (!spaceIds.has(end)) {
        findings.push(
          finding('link-endpoint', `ship#${link.from}->${link.to}`, `unknown space ${end}`),
        )
      }
    }
    if (link.from === link.to) {
      findings.push(finding('link-endpoint', `ship#${link.from}`, 'a link joins a space to itself'))
    }
  }
  return findings
}

/**
 * A structure stands on its floor and under its ceiling.
 *
 * A space with no ceiling of its own takes its tier's, which is what the tour
 * does when it builds the mesh — so that is the height checked against.
 */
const structuresFitTheirSpace: Invariant = ({ blueprint }) => {
  const findings: Finding[] = []
  const tierCeilings = new Map(blueprint.tiers.map((tier) => [tier.id, tier.ceiling]))
  const ceilings = new Map(
    blueprint.spaces.map((space) => [
      space.id,
      space.ceiling ?? tierCeilings.get(space.tierId) ?? null,
    ]),
  )
  for (const structure of blueprint.structures) {
    const ceiling = ceilings.get(structure.spaceId)
    if (ceiling === undefined || ceiling === null) continue
    if (structure.base < 0) {
      findings.push(finding('structure-fit', `ship#${structure.id}`, 'stands below its own floor'))
    }
    if (structure.base + structure.height > ceiling + 0.001) {
      findings.push(
        finding(
          'structure-fit',
          `ship#${structure.id}`,
          `reaches ${structure.base + structure.height}m through a ${ceiling}m ceiling`,
        ),
      )
    }
  }
  return findings
}

/**
 * Every character the site can show is either dated or explicitly undatable.
 *
 * Without `firstAppearanceChapterId` a reader capped at chapter 340 could be
 * shown someone who has not appeared yet, and no loader can tell. The one
 * honest exception is a passenger who appears in no chapter at all — Togashi's
 * databook sheets name several — and `positionProvenance: 'databook'` is how
 * `data/` already says so. Anything else has to carry a chapter.
 */
const spoilerCoverage: Invariant = ({ characters }) => {
  return characters
    .filter(
      (character) =>
        !character.firstAppearanceChapterId &&
        (character as { positionProvenance?: unknown }).positionProvenance !== 'databook',
    )
    .map((character) =>
      finding(
        'spoiler-coverage',
        `characters#${character.id}`,
        'no firstAppearanceChapterId and not marked databook: the spoiler cap cannot be applied',
      ),
    )
}

/** A blueprint space that claims a location has to name one the catalogue holds. */
const shipMeetsTheCatalogue: Invariant = ({ blueprint, locations }) => {
  const known = new Set(locations.map((location) => location.id))
  return blueprint.spaces
    .filter((space) => space.locationId && !known.has(space.locationId))
    .map((space) =>
      finding('ship-location', `ship#${space.id}`, `unknown location ${space.locationId}`),
    )
}

export const INVARIANTS: ReadonlyArray<{ name: string; run: Invariant }> = [
  { name: 'unique-ids', run: uniqueIds },
  { name: 'references-resolve', run: referencesResolve },
  { name: 'chapter-references-are-well-formed', run: chapterReferencesAreWellFormed },
  { name: 'events-are-ordered', run: eventsAreOrdered },
  { name: 'ranked-claims-cite-a-source', run: rankedClaimsCiteASource },
  { name: 'spaces-stand-on-a-deck', run: spacesStandOnADeck },
  { name: 'links-join-real-spaces', run: linksJoinRealSpaces },
  { name: 'structures-fit-their-space', run: structuresFitTheirSpace },
  { name: 'spoiler-coverage', run: spoilerCoverage },
  { name: 'ship-meets-the-catalogue', run: shipMeetsTheCatalogue },
]

export type { Blueprint }
