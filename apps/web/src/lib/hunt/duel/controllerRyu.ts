/**
 * The shared Nen controller's Ryu, read back as the duel's two dials.
 *
 * `huntDuelNen` hands the controller `{ hands: attack, [guard]: 1 - attack }`,
 * and the controller answers with `ryuDistribution(zone, share)` — the chosen
 * zone first. So the first zone named is the guard the player picked (keys 1 to
 * 4), and `hands` is still the attack share. Reading only `hands` dropped the
 * zone keys on the floor: the guard could only be set by clicking.
 */
import type { RyuSetting } from './ryu'
import type { BodyZone } from './state'

const ZONE_OF: Record<string, BodyZone> = {
  head: 'head',
  torso: 'torso',
  hands: 'arms',
  feet: 'legs',
}

export function ryuFromController(
  distribution: Partial<Record<string, number>>,
  attack: number,
): RyuSetting {
  const first = Object.keys(distribution)[0]
  const guard = first ? ZONE_OF[first] : undefined
  return {
    attack: Number((first && distribution[first]) ?? attack),
    ...(guard ? { guard } : {}),
  }
}
