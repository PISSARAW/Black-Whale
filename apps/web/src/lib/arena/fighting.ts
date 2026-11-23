import { FIGHTING_ROSTER, fighterDefinition } from '../fighting/roster'
import { moveForSlot } from '../fighting/movesets'
import type { FighterId, MoveAction, MoveSlot } from '../fighting/types'
import type { BodyZone, CombatAction, CombatSide } from '../combat/types'
import { arenaMoveSlot, type ArenaDirection } from './moveSlot'
import type { Vec2 } from '../tour/types'
import { strikeTarget } from './controls'
import { arenaFrameReadout } from './training'

export const ARENA_FIGHTERS = FIGHTING_ROSTER
export const DEFAULT_ARENA_FIGHTER: FighterId = 'kurapika'
export const DEFAULT_ARENA_OPPONENT: FighterId = 'hisoka'

export function arenaFighterId(
  value: string | null,
  fallback: FighterId = DEFAULT_ARENA_FIGHTER,
): FighterId {
  return FIGHTING_ROSTER.some(({ id }) => id === value) ? (value as FighterId) : fallback
}

export function arenaFighter(id: FighterId) {
  return fighterDefinition(id)
}

export function arenaFighterColour(id: FighterId): number {
  return Number.parseInt(fighterDefinition(id).colour.replace('#', ''), 16)
}

export function arenaFightingMove(options: {
  side: CombatSide
  fighterId: FighterId
  slot: MoveSlot
  position: Vec2
  heading: number
}): Extract<CombatAction, { type: 'FIGHTING_MOVE' }> {
  const { side, fighterId, slot, position, heading } = options
  const move = moveForSlot(fighterId, slot)
  const range = move ? Math.min(8, Math.max(1.6, move.tuning.reach / 5)) : 2.2
  return {
    type: 'FIGHTING_MOVE',
    side,
    fighterId,
    slot,
    targetAt: strikeTarget(position, heading, range),
  }
}

/** Default keys of Clash's five offensive commands. Arena also reads Clash's
 * saved custom bindings at runtime; these labels are the no-preference fallback.
 */
export const ARENA_MOVE_KEYS: Record<MoveAction, { code: string; label: string }> = {
  light: { code: 'KeyJ', label: 'J' },
  heavy: { code: 'KeyK', label: 'K' },
  special: { code: 'KeyL', label: 'L' },
  throw: { code: 'KeyM', label: 'M' },
  finisher: { code: 'KeyI', label: 'I' },
}

/** The variant each command performs right now, given the held direction and the aim. */
export function arenaMoveLabels(
  fighterId: FighterId,
  french: boolean,
  context: { direction: ArenaDirection; aimed: BodyZone; airborne?: boolean },
) {
  return (Object.keys(ARENA_MOVE_KEYS) as MoveAction[]).map((action) => {
    const slot = arenaMoveSlot({ fighterId, action, ...context })
    const move = moveForSlot(fighterId, slot)
    return {
      action,
      slot,
      key: ARENA_MOVE_KEYS[action].label,
      name: move ? (french ? move.nameFr : move.nameEn) : null,
      auraCost: move?.auraCost ?? 0,
      frames: move ? arenaFrameReadout(move, french ? 'fr' : 'en') : null,
    }
  })
}
