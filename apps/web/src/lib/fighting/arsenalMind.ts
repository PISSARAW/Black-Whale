import type { ArcadeFighter } from './types'

/** Voluntary panel orders need an awake mind with control of its actual body. */
export function arsenalMindAvailable(actor: ArcadeFighter): boolean {
  const effects = actor.hatsuEffects
  return ![
    actor.health <= 0,
    actor.blackVoiceControl?.active,
    actor.needlePuppet,
    actor.arsenalSleep,
    actor.halkenburgSleeping,
    actor.kurapika?.blackoutFrames,
    actor.dolphinLoan?.blackoutFrames,
    effects.manipulatedFrames,
    effects.possessedFrames,
    effects.momozeFrames,
  ].some(Boolean)
}
