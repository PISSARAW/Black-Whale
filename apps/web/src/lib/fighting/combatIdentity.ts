import type { ArcadeFighter, FightSide, FighterId } from './types'

export interface CombatIdentity {
  bodyId: string
  mindId: string
  controllerSide?: FightSide
  nenOwnerId: FighterId
  hatsuOwnerId: FighterId
  originBodyId: FighterId
  avatarId: string
  borrowedAura: boolean
}

/** Resolves legacy identity flags into one graph without changing combat authority. */
export function combatIdentityOf(actor: ArcadeFighter, side?: FightSide): CombatIdentity {
  const adapterBody = actor.nenOwner ?? actor.id
  const mindOwner = actor.halkSoul?.mind?.identity ?? actor.halkenburgOrigin ?? adapterBody
  const controllerSide = actor.halkSoul?.mind?.side ?? actor.halkenburgPassenger?.owner ?? side
  const bodyId = `body:${adapterBody}:${actor.halkenburgTransferFrame ?? 0}`
  return {
    bodyId,
    mindId: actor.halkSoul?.mind?.key ?? `mind:${mindOwner}`,
    controllerSide,
    nenOwnerId: adapterBody,
    hatsuOwnerId: actor.attack?.hatsuSource ?? actor.id,
    originBodyId: actor.halkenburgOrigin ?? adapterBody,
    avatarId: actor.hanzoProjection ? `projection:${mindOwner}` : bodyId,
    borrowedAura: Boolean(actor.dolphinExecution?.borrowedTen),
  }
}

export function combatMindControlsBody(actor: ArcadeFighter): boolean {
  return ![
    actor.health <= 0,
    actor.blackVoiceControl?.active,
    actor.needlePuppet,
    actor.arsenalSleep,
    actor.halkenburgSleeping,
    actor.halkenburgPassenger,
    actor.kurapika?.blackoutFrames,
    actor.dolphinLoan?.blackoutFrames,
    actor.hatsuEffects.manipulatedFrames,
    actor.hatsuEffects.possessedFrames,
    actor.hatsuEffects.momozeFrames,
  ].some(Boolean)
}
