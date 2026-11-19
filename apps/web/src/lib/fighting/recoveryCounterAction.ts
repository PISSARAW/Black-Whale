import { recoveryPunishOptions } from './recoveryPunish'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightSide, FightState } from './types'

/** A measured free normal can create space for a retreat; an active true combo cannot be escaped. */
export function recoveryCounter(state: FightState, side: FightSide) {
  return (
    recoveryPunishOptions(state, side).find(
      (o) => o.reaction === 0 && o.approachFrames === 0 && o.move.auraCost === 0,
    )?.move ?? null
  )
}
export function nativeRecoveryCounter(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const move = recoveryCounter(state, 'opponent')
  return move
    ? perform({ state, side: 'opponent', kind: move.kind, moveId: move.id, auraCharged: false })
    : null
}
