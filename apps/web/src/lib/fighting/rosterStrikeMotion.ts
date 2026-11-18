import { moveById } from './movesets'
import { rosterStrikeShape } from './rosterKeyPoses'
import { ROSTER_TECHNIQUES } from './rosterTechniqueDirection'
import { ROSTER_CHOREOGRAPHY, type RosterFighterId, type StrikeShape } from './rosterChoreography'
import type { FighterMove } from './movesetTypes'
import type { FighterId } from './types'

const SPECIALS = ['neutralSpecial', 'forwardSpecial', 'downSpecial', 'backSpecial', 'finisher']
const PHYSICAL = new Set<StrikeShape>([
  'jab',
  'cross',
  'hook',
  'uppercut',
  'palm',
  'hammer',
  'slash',
  'thrust',
  'kick',
  'spin',
  'lowJab',
  'lowKick',
  'sweep',
  'airPunch',
  'airSlash',
  'dive',
  'backhand',
  'charge',
])

/** Reuse the roster's own physical grammar. Utility Hatsu never become fabricated punches. */
export function rosterMoveShape(moveId?: string): StrikeShape | undefined {
  const move = moveById(moveId)
  if (!move) return undefined
  const id = moveOwner(move)
  const normal = rosterStrikeShape(id, move.slot)
  if (normal) return normal
  const techniques = ROSTER_TECHNIQUES[id as RosterFighterId]
  const shape = techniques?.[SPECIALS.indexOf(move.slot)]
  return shape && PHYSICAL.has(shape as StrikeShape) ? (shape as StrikeShape) : undefined
}

export function groundStrikeMove(
  moveId?: string,
): (FighterMove & { fighterId: FighterId }) | undefined {
  const move = moveById(moveId)
  if (!move || move.variant === 'air' || move.variant === 'throw') return undefined
  return rosterMoveShape(moveId) ? { ...move, fighterId: moveOwner(move) } : undefined
}

function moveOwner(move: FighterMove): FighterId {
  return move.id.split(':')[0] as FighterId
}

export function rosterMotionStyle(id: string) {
  return ROSTER_CHOREOGRAPHY[id as RosterFighterId]
}
