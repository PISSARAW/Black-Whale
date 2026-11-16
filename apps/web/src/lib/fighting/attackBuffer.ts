import type { ArcadeFighter } from './types'

/** Hitstop freezes this timer together with physics and attack recovery. */
export function advanceAttackBuffer(fighter: ArcadeFighter): ArcadeFighter {
  const intent = fighter.bufferedAttack
  if (intent?.bufferFrames === undefined) return fighter
  return {
    ...fighter,
    bufferedAttack:
      intent.bufferFrames <= 0
        ? null
        : {
            ...intent,
            bufferFrames: intent.bufferFrames - 1,
          },
  }
}
