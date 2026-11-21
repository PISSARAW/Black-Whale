import { machiStrikeThreadAvailable } from './machiSpool'
import { machiSourceActive } from './machiThread'
import type { FightSide, FightState } from './types'

/**
 * Fil court (SIGNATURE_COMBOS.md): the Troupe Bind, Machi's capture, stitches the body it seizes
 * back into a bind. The thread rules are unchanged: the bind drops as soon as Machi lets go of
 * the thread or exceeds its reach (machiThread.ts). Duel tuning, not canon.
 */
export function troupeBind(state: FightState, side: FightSide): FightState {
  const machi = state[side]
  const targetSide = side === 'player' ? 'opponent' : 'player'
  const target = state[targetSide]
  if (machi.attack?.moveId !== 'machi:throw' || !machi.attack.confirmedHit) return state
  if (target.machiThread?.kind === 'bind' || !machiSourceActive(machi)) return state
  if (!machiStrikeThreadAvailable(state, side)) return state
  return {
    ...state,
    [targetSide]: {
      ...target,
      machiThread: { owner: side, kind: 'bind', x: target.x, y: target.y },
      hatsuEffects: { ...target.hatsuEffects, stitchedFrames: 1 },
    },
  }
}
