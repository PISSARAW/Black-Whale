import { setTrainingResources } from '../../src/lib/fighting/trainingSession'
import { EMPTY_INPUT, type FightState, type FighterId } from '../../src/lib/fighting/types'
import type { ReplayCommand } from '../../src/lib/fighting/fightReplayTypes'
import { fightAcceptsCommands } from '../../src/lib/fighting/fightOutcome'

export type StressScenario = 'projectiles' | 'future' | 'post-mortem' | 'guards' | 'transformation'
export const STRESS_FIGHTERS: Record<StressScenario, FighterId> = {
  projectiles: 'franklin',
  future: 'tserriednich',
  'post-mortem': 'camilla',
  guards: 'yokotani',
  transformation: 'biscuit',
}

/** Scenario premises only; activations still pass through real commands and engine admission. */
export function prepareStressState(state: FightState, scenario?: StressScenario): FightState {
  if (!scenario) return state
  if (state.player.id !== STRESS_FIGHTERS[scenario]) throw Error('Stress scenario fighter mismatch')
  if (scenario === 'post-mortem')
    return setTrainingResources(state, 'player', { health: 1, infiniteHealth: false })
  if (scenario === 'projectiles' || scenario === 'future')
    return { ...state, player: { ...state.player, x: 20 }, opponent: { ...state.opponent, x: 76 } }
  return state
}

export function stressCommands(
  state: FightState,
  tick: number,
  scenario: StressScenario,
): ReplayCommand[] {
  if (state.phase === 'ready') return [{ kind: 'start' }]
  if (state.phase === 'finished') return [{ kind: 'round' }]
  if (!fightAcceptsCommands(state)) return []
  if (scenario === 'post-mortem')
    return tick % 120 === 0 ? [{ kind: 'move', side: 'opponent', action: 'ranged', input: 0 }] : []
  const period = scenario === 'projectiles' ? 60 : 120
  return tick % period === 0 ? [{ kind: 'move', side: 'player', action: 'special', input: 0 }] : []
}

export function stressInputs(scenario: StressScenario) {
  return {
    player: { ...EMPTY_INPUT },
    opponent: { ...EMPTY_INPUT, guard: scenario === 'projectiles' },
  }
}

export function stressManifested(state: FightState, scenario?: StressScenario): boolean {
  if (!scenario) return true
  const visible: Record<StressScenario, boolean> = {
    projectiles: state.projectiles.some((projectile) => projectile.fighterId === 'franklin'),
    future: Boolean(
      state.parallelFuture?.phase === 'vision' || state.parallelFuture?.phase === 'diverging',
    ),
    'post-mortem': Boolean(state.catsName),
    guards: Boolean(state.lsdf?.player),
    transformation: Boolean(state.player.biscuitTrueForm),
  }
  return visible[scenario]
}
