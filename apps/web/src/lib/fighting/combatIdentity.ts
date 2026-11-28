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
function actorController(actor: ArcadeFighter, side?: FightSide): FightSide | undefined {
  return actor.halkSoul?.mind?.side ?? actor.halkenburgPassenger?.owner ?? side
}

function actorMind(actor: ArcadeFighter, adapterBody: FighterId) {
  const mind = actor.halkSoul?.mind
  const originBodyId = actor.halkenburgOrigin ?? adapterBody
  const mindOwner = mind?.identity ?? originBodyId
  return { originBodyId, mindOwner, mindId: mind?.key ?? `mind:${mindOwner}` }
}

export function combatIdentityOf(actor: ArcadeFighter, side?: FightSide): CombatIdentity {
  const adapterBody = actor.nenOwner ?? actor.id
  const { originBodyId, mindOwner, mindId } = actorMind(actor, adapterBody)
  const bodyId = `body:${adapterBody}:${actor.halkenburgTransferFrame ?? 0}`
  return {
    bodyId,
    mindId,
    controllerSide: actorController(actor, side),
    nenOwnerId: adapterBody,
    hatsuOwnerId: actor.attack?.hatsuSource ?? actor.id,
    originBodyId,
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
