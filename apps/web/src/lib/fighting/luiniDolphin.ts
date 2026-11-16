import { luiniAction, luiniAnchor, releaseLuiniAnchor } from './luiniSpatial'
import { withDolphinIdentity } from './kurapikaDolphin'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

/** A borrowed passage includes its preparation, departure and return, with the user's own visits. */
export function finishBorrowedLuini(
  options: AuraAttackOptions,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const { state, side } = options
  const held = state[side].kurapika?.held
  if (held?.source !== 'luini') return null
  if (!luiniAnchor(state, side)) return state
  const action = luiniAction(state, side)
  const next = withDolphinIdentity(
    state,
    (borrowed) => perform({ ...options, state: borrowed, moveId: held.moveId }),
    'luini',
  )
  return action === 'return' && next[side].aura < state[side].aura
    ? releaseLuiniAnchor(next, side)
    : next
}
