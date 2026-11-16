import type { Catalogue, Finding } from './types.js'
type Invariant = (catalogue: Catalogue) => Finding[]
function finding(rule: string, where: string, message: string): Finding {
  return { rule, where, message }
}

/** Every space stands on a deck the blueprint declares. */
export const spacesStandOnADeck: Invariant = ({ blueprint }) => {
  const tierIds = new Set(blueprint.tiers.map((tier) => tier.id))
  return blueprint.spaces
    .filter((space) => !tierIds.has(space.tierId))
    .map((space) => finding('ship-space-tier', `ship#${space.id}`, `unknown tier ${space.tierId}`))
}

/** A door has to join two spaces that exist, and not a space to itself. */
export const linksJoinRealSpaces: Invariant = ({ blueprint }) => {
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

/** A blueprint space that claims a location has to name one the catalogue holds. */
export const shipMeetsTheCatalogue: Invariant = ({ blueprint, locations }) => {
  const known = new Set(locations.map((location) => location.id))
  return blueprint.spaces
    .filter((space) => space.locationId && !known.has(space.locationId))
    .map((space) =>
      finding('ship-location', `ship#${space.id}`, `unknown location ${space.locationId}`),
    )
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
export const rankedClaimsCiteASource: Invariant = ({ blueprint }) => {
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

/**
 * A structure stands on its floor and under its ceiling.
 *
 * A space with no ceiling of its own takes its tier's, which is what the tour
 * does when it builds the mesh — so that is the height checked against.
 */
export const structuresFitTheirSpace: Invariant = ({ blueprint }) => {
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
