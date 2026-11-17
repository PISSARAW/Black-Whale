import { createFightState } from './fightState'
import { setTrainingDummy, setTrainingResources } from './trainingSession'
import type { CombatRoute } from './combatRoutes'
import { prepareCombatRoute } from './combatRouteSetup'
import { combatRouteScenario } from './combatRouteScenario'
import {
  EMPTY_INPUT,
  type FightInput,
  type MoveSlot,
  type FightState,
  type FighterId,
} from './types'

export function createCombatRouteFight(route: CombatRoute, opponent?: FighterId): FightState {
  const preparation = combatRouteScenario(route.setup)
  let state = createFightState(
    route.fighter,
    opponent ?? (route.fighter === 'chrollo' ? 'hisoka' : 'chrollo'),
    {
      mode: 'training',
      formatId: 'knockout',
      environment: { stageId: 'heavens-arena', arenaInteractions: false, preparation },
    },
  )
  state = {
    ...state,
    phase: 'fighting',
    player: { ...state.player, x: preparation ? 22 : 44 },
    opponent: { ...state.opponent, x: 50 },
  }
  for (const side of ['player', 'opponent'] as const)
    state = setTrainingResources(state, side, {
      aura: 100,
      infiniteAura: false,
      infiniteHealth: false,
    })
  return setTrainingDummy(prepareCombatRoute(state, route.setup), { behavior: 'guard-after-hit' })
}
/** Relative directions keep the same route when the fighters exchange sides. */
export function combatRouteInput(slot: MoveSlot, facing: 1 | -1): FightInput {
  return {
    ...EMPTY_INPUT,
    down: slot.startsWith('low') || slot === 'downSpecial',
    right: slot.startsWith('forward') ? facing === 1 : slot.startsWith('back') && facing === -1,
    left: slot.startsWith('forward') ? facing === -1 : slot.startsWith('back') && facing === 1,
  }
}
export function combatRouteAction(slot: MoveSlot) {
  if (slot === 'throw' || slot === 'finisher') return slot
  if (slot.endsWith('Special')) return 'special' as const
  return slot.endsWith('Light') ? ('light' as const) : ('heavy' as const)
}
