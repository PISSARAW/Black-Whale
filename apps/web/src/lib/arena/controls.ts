import type { NenTechniqueAction } from '@black-whale/nen-engine'
import type { BodyZone, CombatAction, FighterState } from '../combat/types'
import type { Vec2 } from '../tour/types'

type RyuAction = Extract<NenTechniqueAction, { type: 'RYU' }>

type TourZone = 'head' | 'torso' | 'hands' | 'feet'

/** Converts the shared Tour Ryu vocabulary into Arena's attack/guard model. */
export function arenaRyuAction(
  action: RyuAction,
  fighter: Pick<FighterState, 'attackShare' | 'guard'>,
): Extract<CombatAction, { type: 'RYU' }> {
  const selected = selectedZone(action.distribution, fighter)
  const focused = Number(action.distribution[selected] ?? defensiveShare(fighter, selected))
  return {
    type: 'RYU',
    side: 'player',
    guard: bodyZone(selected),
    attackShare: selected === 'hands' ? focused : 1 - focused,
  }
}

/** A strike follows the camera ray; range alone is not enough to connect. */
export function strikeTarget(position: Vec2, heading: number, range: number): Vec2 {
  return [position[0] - Math.sin(heading) * range, position[1] - Math.cos(heading) * range]
}

export function auraPercent(aura: number, capacity: number): number {
  if (capacity <= 0) return 0
  return Math.max(0, Math.min(100, (aura / capacity) * 100))
}

function selectedZone(
  distribution: RyuAction['distribution'],
  fighter: Pick<FighterState, 'attackShare' | 'guard'>,
): TourZone {
  for (const zone of ['head', 'feet'] as const) {
    if (distribution[zone] !== undefined) return zone
  }
  const hands = Number(distribution.hands ?? fighter.attackShare)
  const torso = Number(distribution.torso ?? 1 - fighter.attackShare)
  if (hands === torso) return tourZone(fighter.guard)
  return hands > torso ? 'hands' : 'torso'
}

function defensiveShare(
  fighter: Pick<FighterState, 'attackShare' | 'guard'>,
  zone: TourZone,
): number {
  return zone === 'hands' ? fighter.attackShare : 1 - fighter.attackShare
}

function bodyZone(zone: TourZone): BodyZone {
  if (zone === 'hands') return 'arms'
  if (zone === 'feet') return 'legs'
  return zone
}

function tourZone(zone: BodyZone): TourZone {
  if (zone === 'arms') return 'hands'
  if (zone === 'legs') return 'feet'
  return zone
}
