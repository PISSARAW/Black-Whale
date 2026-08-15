import { INHABITANT_INVARIANTS } from './inhabitants.js'
import { LIKENESS_INVARIANTS } from './likeness.js'
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

/**
 * A chapter reference as a single sortable number.
 *
 * `ch-359.4` is the fourth event of chapter 359, so the sequence is a fraction
 * of the chapter rather than a second digit — comparing the two parts as one
 * number is what keeps `ch-359.4` before `ch-361` and after `ch-359`. Null for
 * `ch-unknown`, which sits nowhere in particular.
 */
function chapterPosition(value: string | null | undefined): number | null {
  const match = /^ch-(\d+)(?:\.(\d+))?$/.exec(value ?? '')
  if (!match) return null
  return Number(match[1]) + Number(match[2] ?? 0) / 1000
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
 * chapter that exists, so membership in it proves nothing. The form is the
 * schema's business now; what is left to check is the span — a reference past
 * the end of the arc is a typo the compiler would turn into an invented
 * chapter, because `ensureEvent` creates whatever number it is handed.
 */
const chapterReferencesAreWellFormed: Invariant = ({ characters, abilities, chapters }) => {
  const findings: Finding[] = []
  const numbers = chapters.map((chapter) => chapter.number)
  const last = Math.max(...numbers)

  const check = (where: string, value: string | null | undefined) => {
    if (!value || value === 'ch-unknown') return
    const match = /^ch-(\d+)(?:\.\d+)?$/.exec(value)
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
    const where = `characters#${character.id}`
    check(where, character.firstAppearanceChapterId)
    check(where, character.mapPresenceFromChapterId)
    check(where, character.mapPresenceUntilChapterId)
    for (const leg of character.mapTrajectory ?? []) {
      check(where, leg.fromChapterId)
      check(where, leg.untilChapterId)
    }
  }
  for (const ability of abilities) {
    check(`abilities#${ability.id}`, ability.firstVisibleChapterId)
  }
  return findings
}

/**
 * A position names a room, and a trajectory names a room per leg.
 *
 * A tier is a deck, not a place: a body dropped on one lands at the tier
 * anchor, which on every deck plan is open floor between the rooms, so the map
 * draws a passenger loitering in a corridor canon never put them in. Where
 * canon names only the tier, `data/CONVENTIONS.md` asks for the room the
 * passenger's affiliation implies, marked `inferred`.
 *
 * This used to be checked by `verify_map_coverage.mjs`, which runs against the
 * database — after the deploy had already written the corridor.
 */
const positionsNameARoom: Invariant = ({ characters, locations, blueprint }) => {
  const findings: Finding[] = []
  const known = new Set(locations.map((location) => location.id))
  const knownDoorTargets = new Set([...known, ...blueprint.spaces.map((space) => space.id)])

  for (const character of characters) {
    const where = `characters#${character.id}`
    const ship = character.shipLocation
    const room = String(ship?.room ?? '').trim()

    if (ship && ship.tier != null && !room) {
      findings.push(
        finding(
          'bare-tier',
          where,
          `on tier ${ship.tier} with no room: name the one its role implies`,
        ),
      )
    }
    // Rooms 1001-1014 are the royal residential sector, which is on Tier 1.
    if (/^10(?:0\d|1[0-4])$/.test(room) && ship?.tier !== 1) {
      findings.push(
        finding(
          'bare-tier',
          where,
          `room ${room} is on tier 1 but the entry claims tier ${ship?.tier}`,
        ),
      )
    }

    const legs = character.mapTrajectory ?? []
    for (const [index, leg] of legs.entries()) {
      if (!known.has(leg.location)) {
        findings.push(finding('trajectory', where, `leg ${index} names no known location`))
      }
      if (leg.outsideDoorOf && !knownDoorTargets.has(leg.outsideDoorOf)) {
        findings.push(finding('trajectory', where, `leg ${index} names no known outside-door room`))
      }
      if (/^tier-[1-5]$/.test(leg.location)) {
        findings.push(finding('trajectory', where, `leg ${index} stops on a deck, not in a room`))
      }
      const next = legs[index + 1]
      if (!next) continue
      const starts = chapterPosition(leg.fromChapterId)
      const nextStarts = chapterPosition(next.fromChapterId)
      // Strictly earlier is a route written out of order. Equal is allowed and
      // means something weaker: the catalogue records finer movement than the
      // event log can carry — Hisoka crosses the Tier 3 block into the cineplex
      // inside chapter 392, which holds two events and no pin for either leg.
      // The compiler settles that by keeping the last leg of the group, which
      // is the position the chapter leaves the body in.
      if (starts !== null && nextStarts !== null && nextStarts < starts) {
        findings.push(finding('trajectory', where, `leg ${index + 1} starts before leg ${index}`))
      }
      // A declared end before the next leg begins is a gap, and gaps are real:
      // Momoze dies in her room at 368 and is carried to the burial chamber at
      // 371, so nothing should draw her in either place in between. What is
      // forbidden is an end *after* the successor starts, which would put one
      // body in two rooms at once.
      const ends = chapterPosition(leg.untilChapterId)
      if (ends !== null && nextStarts !== null && ends > nextStarts) {
        findings.push(
          finding('trajectory', where, `leg ${index} ends after leg ${index + 1} has begun`),
        )
      }
    }
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

/** Every chapter-level Hatsu claim resolves to the canon it annotates. */
const abilityUsesResolve: Invariant = ({
  abilityUses,
  abilities,
  characters,
  chapters,
  events,
}) => {
  const findings: Finding[] = []
  const abilityIds = new Set(abilities.map((ability) => ability.id))
  const characterIds = new Set(characters.map((character) => character.id))
  const chapterNumbers = new Set(chapters.map((chapter) => chapter.number))
  const eventsByTitle = new Map(events.map((event) => [event.title, event]))
  const seen = new Set<string>()

  for (const use of abilityUses) {
    const where = `ability-uses#${use.id}`
    if (seen.has(use.id)) findings.push(finding('ability-use-id', where, 'duplicate id'))
    seen.add(use.id)
    if (!abilityIds.has(use.abilityId)) {
      findings.push(finding('ability-use-ability', where, `unknown reference ${use.abilityId}`))
    }
    if (!characterIds.has(use.userId)) {
      findings.push(finding('ability-use-user', where, `unknown reference ${use.userId}`))
    }
    if (!chapterNumbers.has(use.chapter)) {
      findings.push(finding('ability-use-chapter', where, `unknown chapter ${use.chapter}`))
    }
    if (use.eventTitle) {
      const event = eventsByTitle.get(use.eventTitle)
      if (!event) {
        findings.push(finding('ability-use-event', where, `unknown event ${use.eventTitle}`))
      } else if (event.chapter !== use.chapter) {
        findings.push(
          finding(
            'ability-use-event',
            where,
            `${use.eventTitle} belongs to chapter ${event.chapter}, not ${use.chapter}`,
          ),
        )
      }
    }
  }
  return findings
}

export const INVARIANTS: ReadonlyArray<{ name: string; run: Invariant }> = [
  { name: 'unique-ids', run: uniqueIds },
  { name: 'references-resolve', run: referencesResolve },
  { name: 'chapter-references-are-well-formed', run: chapterReferencesAreWellFormed },
  { name: 'events-are-ordered', run: eventsAreOrdered },
  { name: 'positions-name-a-room', run: positionsNameARoom },
  { name: 'ranked-claims-cite-a-source', run: rankedClaimsCiteASource },
  { name: 'spaces-stand-on-a-deck', run: spacesStandOnADeck },
  { name: 'links-join-real-spaces', run: linksJoinRealSpaces },
  { name: 'structures-fit-their-space', run: structuresFitTheirSpace },
  { name: 'spoiler-coverage', run: spoilerCoverage },
  { name: 'ship-meets-the-catalogue', run: shipMeetsTheCatalogue },
  { name: 'ability-uses-resolve', run: abilityUsesResolve },
  // The rules the inhabited walk rests on. Kept in a file of their own so this
  // one stays under the 500 lines ADR-002 allows, and appended here so there is
  // still one list canon-lint runs.
  ...INHABITANT_INVARIANTS,
  // And the rules the drawn walk rests on — ADR-005, same arrangement.
  ...LIKENESS_INVARIANTS,
]

export type { Blueprint }
