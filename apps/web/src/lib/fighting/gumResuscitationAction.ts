import { canAct } from './fightActorState'
import { ownsBungeeGum } from './bungeeAccess'
import { physicalBodyKey } from './fightBodyIdentity'
import { GUM_RESUSCITATION_COST } from './gumResuscitationRules'
import type { FightSide, FightState } from './types'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'

export function performGumResuscitation(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action !== 'gum-program-resuscitation' || !canPrepareResuscitation(state, side))
    return state
  const actor = state[side]
  return {
    ...state,
    [side]: {
      ...actor,
      aura: actor.aura - GUM_RESUSCITATION_COST,
      arenaRecovery: 18,
      gumResuscitationProgram: {
        bodyKey: physicalBodyKey(state, side),
        preparedAt: state.frame,
        order: 'heart-and-lungs',
      },
    },
  }
}
function canPrepareResuscitation(state: FightState, side: FightSide): boolean {
  const body = state[side]
  return [
    body.id === 'hisoka',
    (body.nenOwner ?? body.id) === 'hisoka',
    ownsBungeeGum(body),
    canAct(body),
    !body.attack,
    !body.hanzoProjection,
    !body.halkenburgSoul,
    !body.halkenburgPassenger,
    !body.gumResuscitationProgram,
    body.aura >= GUM_RESUSCITATION_COST,
  ].every(Boolean)
}
export function gumResuscitationOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'hisoka') return []
  return [
    {
      command: { action: 'gum-program-resuscitation' },
      labelFr: 'Bungee Gum · Programmer le cœur et les poumons',
      labelEn: 'Bungee Gum · Program heart and lung pumping',
      conditionFr:
        'Ordre donné de son vivant. Le succès du chapitre 357 exige une asphyxie déclarée, des organes viables et de l’air rétabli ; aucun retour automatique après un KO ou une autre mort. Préparation : huit aura de duel.',
      conditionEn:
        'An order given while alive. The chapter 357 success requires declared asphyxia, viable organs and restored air; no automatic return after a KO or another death. Preparation: eight duel aura.',
      ready: canPrepareResuscitation(state, side),
    },
  ]
}
