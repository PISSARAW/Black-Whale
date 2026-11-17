import { get, writable } from 'svelte/store'
import { combatRoute, combatRoutesFor, type CombatFighter } from './combatRoutes'
import { createCombatRouteFight, combatRouteAction, combatRouteInput } from './combatRouteFight'
import {
  initialCombatProgress,
  observeCombatRoute,
  observeCombatDefense,
  type CombatProgress,
} from './combatSchoolProgress'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import { setTrainingDummy } from './trainingSession'
import { packReplayInput } from './fightReplayInput'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'
import type { ReplayCommand } from './fightReplayTypes'

export function createCombatSchool() {
  const view = writable<ReturnType<typeof initialCombatProgress> | null>(null)
  let sentStep = -1
  let opponentAt = -1000
  function definition(id: string) {
    return id.endsWith(':defense')
      ? combatRoutesFor(id.split(':')[0] as CombatFighter)[0]
      : combatRoute(id)
  }
  return {
    subscribe: view.subscribe,
    get active() {
      return get(view) !== null
    },
    get demonstrating() {
      return get(view)?.demo === true
    },
    start(id: string, demo = false): FightState {
      const route = definition(id)
      if (!route) throw Error('Unknown combat exercise')
      sentStep = -1
      opponentAt = -1000
      view.set(initialCombatProgress(id, demo))
      // A common, genuinely punishable heavy keeps this lesson stable across personal links.
      const defensePartner = id.endsWith(':defense') ? ('benjamin' as const) : undefined
      const state = createCombatRouteFight(route, defensePartner)
      return id.endsWith(':defense') ? setTrainingDummy(state, { behavior: 'manual' }) : state
    },
    release() {
      sentStep = -1
    },
    exit() {
      view.set(null)
    },
    observe(state: FightState) {
      const current = get(view)
      if (!current) return
      const route = definition(current.id)
      if (
        state.mode !== 'training' ||
        state.player.id !== route.fighter ||
        state.frame < current.lastFrame
      ) {
        view.set(null)
        return
      }
      const next = current.id.endsWith(':defense')
        ? observeCombatDefense(current, state)
        : observeCombatRoute(current, state, route)
      if (next !== current) view.set(next)
    },
    input(state: FightState, input: FightInput): FightInput {
      const current = get(view)
      if (!current?.demo) return input
      return { ...EMPTY_INPUT, jump: definition(current.id).kind === 'air' && state.frame < 4 }
    },
    command(state: FightState): ReplayCommand | null {
      const current = get(view)
      if (!current || current.complete || current.failed) return null
      if (current.id.endsWith(':defense')) {
        const command = defenseCommand(current, state, opponentAt)
        if (command) opponentAt = state.frame
        return command
      }
      const command = demonstrationCommand(current, state, sentStep)
      if (command) sentStep = current.step
      return command
    },
  }
}
export type CombatSchool = ReturnType<typeof createCombatSchool>

export function advanceCombatSchool(options: {
  school: CombatSchool
  match: import('./fightMatchRuntime').FightMatchRuntime
  state: FightState
  input: FightInput
  opponentInput: FightInput
  dt: number
}): FightState {
  const { school, match, state } = options
  if (match.replays.active)
    return match.advance(state, options.input, {
      dt: options.dt,
      opponentInput: options.opponentInput,
    })
  const command = school.command(state)
  if (command) match.enqueue(state, command)
  return match.advance(state, school.input(state, options.input), {
    dt: options.dt,
    opponentInput: school.active ? EMPTY_INPUT : options.opponentInput,
  })
}

function defenseCommand(
  progress: CombatProgress,
  state: FightState,
  opponentAt: number,
): ReplayCommand | null {
  if (progress.step > 0 || state.frame < 30 || state.frame - opponentAt < 120) return null
  return { kind: 'move', side: 'opponent', action: 'heavy', input: 0 }
}
function demonstrationCommand(
  progress: CombatProgress,
  state: FightState,
  sentStep: number,
): ReplayCommand | null {
  if (!progress.demo || sentStep === progress.step) return null
  const route = combatRoute(progress.id)
  if (progress.step === 0 && route.kind === 'air' && state.frame < 27) return null
  const slot = route.moves[progress.step]
  const move = moveForSlot(route.fighter, slot)!
  if (
    state.player.attack?.moveId === move.id ||
    !canStartFighterAttack(state.player, move.kind, move.id)
  )
    return null
  return {
    kind: 'move',
    side: 'player',
    action: combatRouteAction(slot),
    input: packReplayInput(combatRouteInput(slot, state.player.facing)),
  }
}
