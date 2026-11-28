import { drawRosterBody } from './rosterGuests'
import { readyCohort } from './preparationWorld'
import { COHORT_WILL_FRAMES } from './preparationTuning'
import { canAct } from './fightActorState'
import { voluntaryNenAvailable } from './nenAccess'
import { chainAbilitySealed } from './kurapika'
import { halkenburgRosterVariant } from './halkenburgVariant'
import { halkenburgMode, preserveRosterSoul } from './halkenburgSoulTypes'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState, FighterId } from './types'

declare module './types' {
  interface ArcadeFighter {
    halkenburgOrigin?: FighterId
    halkenburgTransferFrame?: number
  }
}

/** Requested duel adaptation: Halkenburg's seat becomes the randomly drawn host body. */
export function replaceHalkenburgBody(state: FightState, side: FightSide): FightState {
  if (!halkenburgRosterVariant(state)) return state
  const actor = state[side]
  const drawn = drawRosterBody(state, side)
  const body = drawn.fighter
  return {
    ...drawn.state,
    [side]: preserveRosterSoul(actor, {
      ...body,
      x: actor.x,
      y: actor.y,
      velocityY: actor.velocityY,
      facing: actor.facing,
      health: Math.max(1, Math.round((body.maxHealth * actor.health) / actor.maxHealth)),
      aura: Math.min(actor.aura, body.aura),
      halkenburgOrigin: actor.halkenburgOrigin ?? actor.id,
      halkenburgTransferFrame: state.frame,
    }),
  }
}

export function performHalkenburgTransfer({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side]
  if (command.action !== 'halkenburg-transfer' || actor.id !== 'halkenburg') return state
  if (!transferBodyReady(state, side)) return state
  if (
    actor.aura < 30 ||
    actor.hatsuEffects.cohortWillFrames < COHORT_WILL_FRAMES ||
    !readyCohort(state, side).length
  )
    return state
  const charged = {
    ...state,
    [side]: {
      ...actor,
      aura: actor.aura - 30,
      hatsuEffects: { ...actor.hatsuEffects, cohortWillFrames: 0 },
    },
  }
  return replaceHalkenburgBody(charged, side)
}

function transferBodyReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return (
    halkenburgRosterVariant(state) &&
    halkenburgMode(state, side) === 'roster' &&
    !actor.halkSoul?.linked &&
    state.phase === 'fighting' &&
    !state.catsName &&
    canAct(actor) &&
    !actor.attack &&
    voluntaryNenAvailable(actor) &&
    !chainAbilitySealed(actor, 'halkenburg:neutralSpecial')
  )
}

export function halkenburgTransferOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'halkenburg' || !halkenburgRosterVariant(state)) return []
  const command = { action: 'halkenburg-transfer' as const }
  return [
    {
      command,
      ready: performHalkenburgTransfer({ state, side, command }) !== state,
      labelFr: 'Halkenburg · Transfert dans un corps du roster',
      labelEn: 'Halkenburg · Transfer into a roster body',
      conditionFr:
        'Variante choisie, hors canon : le corps tiré au sort remplace Halkenburg avec ses coups et son Hatsu. Groupe marqué, consentant et volonté réunie requis. Le transfert ne restaure pas les PV.',
      conditionEn:
        'Selected non-canonical variant: the drawn host replaces Halkenburg with its moves and Hatsu. Marked consenting cohort and gathered will required. The transfer does not restore health.',
    },
  ]
}
