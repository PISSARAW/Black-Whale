import type { ArcadeFighter } from './types'
import { combatIdentityOf } from './combatIdentity'

/** Dolphin can execute an external Hatsu while the actual carrier remains unprotected in Zetsu. */
export function physicalNenBody(actor: ArcadeFighter): ArcadeFighter {
  const execution = actor.dolphinExecution
  return execution && combatIdentityOf(actor).borrowedAura
    ? {
        ...actor,
        aura: execution.ownAura,
        auraExhausted: execution.ownExhausted,
        nen: execution.ownNen,
      }
    : actor
}
