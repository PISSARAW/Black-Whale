import type { Ship, TierPlan } from './blueprint'
import type { Doorway, Space, Structure, Tier } from './types'

interface GroupOptions {
  ship: Ship
  nameOf: (item: { name: string; nameFr: string }) => string
  locale: 'fr' | 'en'
}

export interface SpaceTargetGroup { tier: Tier; spaces: Space[] }
export interface SolidTargetGroup { tier: Tier; solids: Structure[] }

const byName = (options: GroupOptions) =>
  (left: { name: string; nameFr: string }, right: { name: string; nameFr: string }) =>
    options.nameOf(left).localeCompare(options.nameOf(right), options.locale)

export function groupSpaceTargets(options: GroupOptions): SpaceTargetGroup[] {
  return options.ship.tiers.map((tier) => ({
    tier,
    spaces: options.ship.blueprint.spaces
      .filter((space) => space.tierId === tier.id)
      .sort(byName(options)),
  }))
}

export function groupSolidTargets(options: GroupOptions): SolidTargetGroup[] {
  return options.ship.tiers
    .map((tier) => ({
      tier,
      solids: options.ship.structures
        .filter((solid) => options.ship.spaces.get(solid.spaceId)?.tierId === tier.id)
        .sort(byName(options)),
    }))
    .filter((group) => group.solids.length > 0)
}

const increment = (counts: Map<string, number>, reason: string) => {
  counts.set(reason, (counts.get(reason) ?? 0) + 1)
  return counts
}

const ranked = (counts: Map<string, number>): [string, number][] =>
  [...counts.entries()].sort((left, right) => right[1] - left[1])

export function blindWallReasons(plan: TierPlan, french: boolean): [string, number][] {
  const counts = plan.blind.reduce((result, wall) => {
    const reason = french ? wall.seal.reasonFr : wall.seal.reason
    return increment(result, reason)
  }, new Map<string, number>())
  return ranked(counts)
}

function sameDoor(left: Doorway, right: { a: string; b: string }): boolean {
  return (left.a === right.a && left.b === right.b) || (left.a === right.b && left.b === right.a)
}

export function declaredDoorReasons(options: {
  plan: TierPlan
  ship: Ship
  french: boolean
}): [string, number][] {
  const counts = options.plan.doorways.reduce((result, door) => {
    const declared = options.ship.doors.find((candidate) => sameDoor(door, candidate))
    if (!declared) return result
    return increment(result, options.french ? declared.reasonFr : declared.reason)
  }, new Map<string, number>())
  return ranked(counts)
}
