import { canAct } from './fightActorState'
import { ownsBungeeGum } from './hisokaArsenal'
import type { FightDeath } from './fightDeaths'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

declare module './types' {
  interface ArcadeFighter {
    gumHeartArmed?: boolean
    gumHeartSpent?: boolean
    gumHeartFrame?: number
    gumHeartPreparation?: number
  }
}

/** Ch. 357: a prior command to the gum around the heart/lungs; not a response to any lethal injury. */
export function performGumHeart({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side]
  if (command.action !== 'gum-heart' || actor.id !== 'hisoka' || !ownsBungeeGum(actor)) return state
  if (
    !canAct(actor) ||
    actor.attack ||
    actor.gumHeartArmed ||
    actor.gumHeartPreparation ||
    actor.gumHeartSpent ||
    actor.aura < 20
  )
    return state
  return {
    ...state,
    [side]: { ...actor, aura: actor.aura - 20, arenaRecovery: 18, gumHeartPreparation: 18 },
  }
}
export function advanceGumHeart(state: FightState): FightState {
  for (const side of ['player', 'opponent'] as const) {
    const actor = state[side]
    if (!actor.gumHeartPreparation) continue
    const interrupted = actor.hitStun > 0 || actor.knockdownFrames > 0 || !ownsBungeeGum(actor)
    const remaining = interrupted ? 0 : actor.gumHeartPreparation - 1
    state = {
      ...state,
      [side]: {
        ...actor,
        gumHeartPreparation: remaining,
        gumHeartArmed: !interrupted && remaining === 0,
      },
    }
  }
  return state
}
export function resolveGumHeart(state: FightState, death: FightDeath): FightState | null {
  if (state[death.victimSide].halkForeignMind) return null
  const side = death.victimSide,
    actor = state[side]
  if (
    death.cause !== 'asphyxia' ||
    actor.id !== 'hisoka' ||
    !actor.gumHeartArmed ||
    actor.gumHeartSpent
  )
    return null
  if (actor.health > 0 || actor.hatsuEffects.hatsuStolen > 0 || actor.stolenChainAbility)
    return null
  return {
    ...state,
    [side]: {
      ...actor,
      health: 1,
      attack: null,
      bufferedAttack: null,
      hitStun: 0,
      blockStun: 0,
      knockdownFrames: 0,
      velocityY: 0,
      gumHeartArmed: false,
      gumHeartSpent: true,
      gumHeartFrame: state.frame,
    },
  }
}
export function gumHeartOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'hisoka') return []
  const command = { action: 'gum-heart' as const }
  return [
    {
      command,
      ready: performGumHeart({ state, side, command }) !== state,
      labelFr: state[side].gumHeartArmed
        ? 'Massage de gomme · Ordre préparé'
        : 'Préparer le massage de gomme post-mortem',
      labelEn: state[side].gumHeartArmed
        ? 'Gum massage · Order prepared'
        : 'Prepare post-mortem gum massage',
      conditionFr:
        'Ordre donné vivant, aura engagée et préparation vulnérable. Un seul redémarrage à 1 PV après une asphyxie réellement attribuée, sans réparation des blessures. Les autres morts restent mortelles. Coût, délai et PV : réglages du duel.',
      conditionEn:
        'Order issued alive, committed aura and vulnerable preparation. One restart at 1 HP after attributed asphyxia, without repairing wounds. Other deaths remain lethal. Cost, timing and HP are duel tuning.',
    },
  ]
}
