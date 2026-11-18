import { moveForSlot } from './movesets'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { FighterMove } from './movesetTypes'

/** A close-range setup is earned in the fighter's stance, not fired at the maximum empty hitbox. */
export function conversionApproach(
  fighter: ArcadeFighter,
  range: readonly [number, number],
  preparing: boolean,
): readonly [number, number] {
  if (!preparing || fighter.nenConversionCount || range[0] >= 14) return range
  const opener = moveForSlot(fighter.id, 'standingLight')
  return opener ? [Math.min(4, opener.tuning.reach), Math.min(8, opener.tuning.reach)] : range
}
export function personalApplicationReady(
  state: FightState,
  side: FightSide,
  move: FighterMove,
): boolean {
  const f = state[side],
    range = f.nenTactics?.range
  if (move.kind !== 'special' || f.nenTactics?.goal !== 'prepare' || !range) return true
  if (range[0] >= 14 || move.tuning.reach === 0) return true
  return Math.abs(f.x - state[side === 'player' ? 'opponent' : 'player'].x) <= range[1]
}
