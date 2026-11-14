import type { Catalogue, Finding } from './types.js'

type Invariant = (catalogue: Catalogue) => Finding[]

function finding(rule: string, where: string, message: string): Finding {
  return { rule, where, message }
}

/** Physical structures stay inside the space that owns them. */
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
    if (structure.base < 0)
      findings.push(finding('structure-fit', `ship#${structure.id}`, 'stands below its own floor'))
    if (structure.base + structure.height > ceiling + 0.001)
      findings.push(
        finding(
          'structure-fit',
          `ship#${structure.id}`,
          `reaches ${structure.base + structure.height}m through a ${ceiling}m ceiling`,
        ),
      )
  }
  return findings
}

/** Every visible character is dated or explicitly sourced from a databook. */
const spoilerCoverage: Invariant = ({ characters }) =>
  characters
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

/** Blueprint spaces only reference known catalogue locations. */
const shipMeetsTheCatalogue: Invariant = ({ blueprint, locations }) => {
  const known = new Set(locations.map((location) => location.id))
  return blueprint.spaces
    .filter((space) => space.locationId && !known.has(space.locationId))
    .map((space) =>
      finding('ship-location', `ship#${space.id}`, `unknown location ${space.locationId}`),
    )
}

interface AbilityUseContext {
  abilityIds: Set<string>
  characterIds: Set<string>
  chapterNumbers: Set<number>
  eventsByTitle: Map<string, Catalogue['events'][number]>
  locationIds: Set<string>
  seen: Set<string>
}

function eventFindings(
  use: Catalogue['abilityUses'][number],
  context: AbilityUseContext,
  where: string,
): Finding[] {
  if (!use.eventTitle) return []
  const event = context.eventsByTitle.get(use.eventTitle)
  if (!event) return [finding('ability-use-event', where, `unknown event ${use.eventTitle}`)]
  if (event.chapter === use.chapter) return []
  return [
    finding(
      'ability-use-event',
      where,
      `${use.eventTitle} belongs to chapter ${event.chapter}, not ${use.chapter}`,
    ),
  ]
}

function traceFindings(
  use: Catalogue['abilityUses'][number],
  context: AbilityUseContext,
  where: string,
): Finding[] {
  if (!use.auraTrace) return []
  const findings: Finding[] = []
  if (!context.locationIds.has(use.auraTrace.locationId))
    findings.push(
      finding('ability-use-trace', where, `unknown trace location ${use.auraTrace.locationId}`),
    )
  if (!['ACTIVATED', 'MAINTAINED'].includes(use.status))
    findings.push(
      finding('ability-use-trace', where, `a ${use.status} use cannot leave an aura trace`),
    )
  return findings
}

function abilityUseFindings(
  use: Catalogue['abilityUses'][number],
  context: AbilityUseContext,
): Finding[] {
  const findings: Finding[] = []
  const where = `ability-uses#${use.id}`
  if (context.seen.has(use.id)) findings.push(finding('ability-use-id', where, 'duplicate id'))
  context.seen.add(use.id)
  if (!context.abilityIds.has(use.abilityId))
    findings.push(finding('ability-use-ability', where, `unknown reference ${use.abilityId}`))
  if (!context.characterIds.has(use.userId))
    findings.push(finding('ability-use-user', where, `unknown reference ${use.userId}`))
  if (!context.chapterNumbers.has(use.chapter))
    findings.push(finding('ability-use-chapter', where, `unknown chapter ${use.chapter}`))
  return [...findings, ...eventFindings(use, context, where), ...traceFindings(use, context, where)]
}

/** Every chapter-level Hatsu claim resolves to the canon it annotates. */
const abilityUsesResolve: Invariant = ({
  abilityUses,
  abilities,
  characters,
  chapters,
  events,
  locations,
}) => {
  const context: AbilityUseContext = {
    abilityIds: new Set(abilities.map((ability) => ability.id)),
    characterIds: new Set(characters.map((character) => character.id)),
    chapterNumbers: new Set(chapters.map((chapter) => chapter.number)),
    eventsByTitle: new Map(events.map((event) => [event.title, event])),
    locationIds: new Set(locations.map((location) => location.id)),
    seen: new Set<string>(),
  }
  return abilityUses.flatMap((use) => abilityUseFindings(use, context))
}

export const CATALOGUE_INVARIANTS: ReadonlyArray<{ name: string; run: Invariant }> = [
  { name: 'structures-fit-their-space', run: structuresFitTheirSpace },
  { name: 'spoiler-coverage', run: spoilerCoverage },
  { name: 'ship-meets-the-catalogue', run: shipMeetsTheCatalogue },
  { name: 'ability-uses-resolve', run: abilityUsesResolve },
]
