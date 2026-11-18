import { battleAppearance } from './battleCantabileRules'
import { canAct } from './fightActorState'
import { fighterDefinition } from './roster'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState, FighterId } from './types'

declare module './battleCantabileTypes' {
  interface BattleCantabile {
    selectedModel?: FighterId
  }
}

/** A remembered model remains selectable after that person leaves the active duel seat. */
export function selectedBattleModel(state: FightState, side: FightSide): FighterId {
  return (
    state[side].battleCantabile?.selectedModel ??
    battleAppearance(state[side === 'player' ? 'opponent' : 'player'])
  )
}

export function performModelSelection({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side],
    battle = actor.battleCantabile
  if (command.action !== 'bono-model' || actor.id !== 'bonolenov' || !battle) return state
  if (!modelSelectionReady(state, side)) return state
  const model = command.target as FighterId,
    known = battle.models[model]
  if (!modelWasLearned(known) || model === battle.selectedModel) return state
  return { ...state, [side]: { ...actor, battleCantabile: { ...battle, selectedModel: model } } }
}

function modelSelectionReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    canAct(actor) &&
    !actor.attack &&
    !actor.battleCantabile?.preparation
  )
}

function modelWasLearned(known?: import('./battleCantabileTypes').BattleModel): boolean {
  return Boolean(known?.spoken && known.frames > 0)
}

export function modelSelectionOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const actor = state[side]
  if (actor.id !== 'bonolenov') return []
  return Object.entries(actor.battleCantabile?.models ?? {})
    .filter(([, model]) => model.spoken && model.frames > 0)
    .map(([id, known]) => {
      const command = { action: 'bono-model' as const, target: id }
      return {
        command,
        ready: performModelSelection({ state, side, command }) !== state,
        labelFr: `Metamorphosen · ${fighterDefinition(id as FighterId).name} · ${(known.frames / 60).toFixed(1)} s`,
        labelEn: `Metamorphosen · ${fighterDefinition(id as FighterId).name} · ${(known.frames / 60).toFixed(1)} s`,
        conditionFr:
          'Modèle réellement rencontré avec échange de paroles. La durée acquise est conservée après son départ. L’apparence ne donne ni son Hatsu ni ses souvenirs. Le choix ne change pas une transformation déjà en cours.',
        conditionEn:
          'An actual encounter and spoken exchange are required. Earned time survives the model’s departure. Appearance grants neither its Hatsu nor memories. Selection does not replace an active form.',
      }
    })
}

/** Observing the active appearance does not disclose the user’s library or next choice. */
export function redactBattleModels(fighter: import('./types').ArcadeFighter): void {
  if (!fighter.battleCantabile) return
  fighter.battleCantabile = { ...fighter.battleCantabile, models: {}, selectedModel: undefined }
}
