import { createFightState } from './fightState'
import { setTrainingDummy, setTrainingResources } from './trainingSession'
import type { CombatRoute } from './combatRoutes'
import { prepareCombatRoute } from './combatRouteSetup'
import { combatRouteScenario } from './combatRouteScenario'
import { withKameos } from './kameos/state'
import {
  EMPTY_INPUT,
  type FightInput,
  type MoveSlot,
  type FightState,
  type FighterId,
} from './types'

export const COMBAT_ROUTE_AIR_OPENING_FRAME = 16

export function createCombatRouteFight(route: CombatRoute, opponent?: FighterId): FightState {
  const preparation = combatRouteScenario(route.setup)
  let state = createFightState(route.fighter, opponent ?? routeOpponent(route), {
    mode: 'training',
    formatId: 'knockout',
    environment: { stageId: 'heavens-arena', arenaInteractions: false, preparation },
  })
  if (route.kameo) state = withKameos(state, { player: route.kameo.id })
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
  state = prepareCombatRoute(state, route.setup)
  if (route.kameo?.id === 'tubeppa')
    state = { ...state, player: { ...state.player, health: state.player.maxHealth - 40 } }
  if (route.whiff) state = { ...state, player: { ...state.player, x: 50 - route.whiff.gap } }
  return setTrainingDummy(state, { behavior: route.recoveryFinish ? 'manual' : 'guard-after-hit' })
}

function routeOpponent(route: CombatRoute): FighterId {
  return (
    route.wakeup ?? route.whiff?.opponent ?? (route.fighter === 'chrollo' ? 'hisoka' : 'chrollo')
  )
}

export function relocatePreparedPaper(
  state: FightState,
  { x, facing }: { x: number; facing: 1 | -1 },
): Pick<FightState, 'battlefield' | 'projectiles'> {
  const relocate = (position: number) => x + facing * (position - state.opponent.x)
  return {
    battlefield: state.battlefield && {
      ...state.battlefield,
      entities: state.battlefield.entities.map((entity) =>
        entity.paperScatter ? { ...entity, x: relocate(entity.x) } : entity,
      ),
    },
    projectiles: state.projectiles.map((shot) =>
      shot.kallutoPaper
        ? { ...shot, x: relocate(shot.x), velocityX: shot.velocityX * facing }
        : shot,
    ),
  }
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
