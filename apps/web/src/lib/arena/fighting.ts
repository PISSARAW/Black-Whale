import { FIGHTING_ROSTER, fighterDefinition } from '../fighting/roster'
import { moveForSlot } from '../fighting/movesets'
import type { FighterId, MoveSlot } from '../fighting/types'
import type { CombatAction, CombatSide } from '../combat/types'
import type { Vec2 } from '../tour/types'
import { strikeTarget } from './controls'

export const ARENA_FIGHTERS = FIGHTING_ROSTER
export const DEFAULT_ARENA_FIGHTER: FighterId = 'kurapika'

export function arenaFighterId(value: string | null): FighterId {
  return FIGHTING_ROSTER.some(({ id }) => id === value)
    ? (value as FighterId)
    : DEFAULT_ARENA_FIGHTER
}

export function arenaFighter(id: FighterId) {
  return fighterDefinition(id)
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

export function arenaMoveLabels(fighterId: FighterId, french: boolean) {
  return (['standingLight', 'standingHeavy', 'neutralSpecial'] as const).map((slot) => {
    const move = moveForSlot(fighterId, slot)
    return {
      slot,
      name: move ? (french ? move.nameFr : move.nameEn) : slot,
      auraCost: move?.auraCost ?? 0,
    }
  })
}
