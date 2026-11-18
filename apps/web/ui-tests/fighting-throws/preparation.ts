import {
  beginFight,
  createFight,
  performMove,
  performThrow,
  tickFight,
  performAuraAttack,
} from '$lib/fighting/engine'
import { createFightEnvironment } from '$lib/fighting/fightEnvironment'
import { commandMary } from '$lib/fighting/bloodyMaryAction'
import { COHORT_WILL_FRAMES } from '$lib/fighting/preparationTuning'
import { THROW_TECH_FRAMES } from '$lib/fighting/throwRules'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from '$lib/fighting/types'
import { prepareEighth, type EighthPreparation } from './eighthPreparation'
import { prepareSeventh } from './seventhPreparation'

const TAPE_FRAMES = 180
export type ThrowDemoOptions = Partial<EighthPreparation> & {
  side?: FightSide
  id?: FighterId
  opponentId?: FighterId
  tech?: boolean
  miss?: boolean
  ko?: boolean
  powered?: boolean
  freezeKO?: boolean
  trueForm?: boolean
  confiscated?: boolean
  bleed?: boolean
  poem?: boolean
  prologue?: boolean
  noNeedles?: boolean
  sealed?: boolean
  plant?: boolean
  cohort?: boolean
  bird?: boolean
  console?: boolean
  offer?: boolean
  owl?: boolean
}

/** Build the fixture from native commands, including every preparation and recorded throw frame. */
export function prepareThrowDemo(options: ThrowDemoOptions = {}): FightState[] {
  const side = options.side ?? 'player'
  const ready = { ...options, side }
  let current = prepareResources(initialState(options), ready)
  current = prepareAbilities(current, ready)
  current = configureThrow(current, ready)
  current = performThrow(current, side, { ...EMPTY_INPUT, aura: Boolean(options.powered) })
  const tape = [current]
  for (let i = 0; i < TAPE_FRAMES; i++) {
    current = advance(current, 1)
    tape.push(current)
  }
  return tape
}

type Setup = ThrowDemoOptions & { side: FightSide }
function initialState(options: ThrowDemoOptions): FightState {
  const { id = 'hisoka', side = 'player', opponentId = 'kurapika' } = options
  const base = beginFight(
    createFight(side === 'player' ? id : opponentId, side === 'opponent' ? id : opponentId, {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: demoEnvironment(options),
    }),
  )
  return {
    ...base,
    player: { ...base.player, x: 46, aura: 100 },
    opponent: { ...base.opponent, x: 51, aura: 100 },
  }
}
function demoEnvironment(options: ThrowDemoOptions) {
  const side = options.side ?? 'player'
  const resources: ('plants' | 'birds' | 'animals' | 'objects')[] = []
  if (options.plant) resources.push('plants')
  if (options.bird) resources.push('birds')
  if (options.animal) resources.push('animals')
  if (options.relay) resources.push('objects')
  return createFightEnvironment({
    ...(options.guards
      ? {
          stageId: 'heilly-hideout' as const,
          morenaPresent: true,
          unlawfulIntruders: { player: side !== 'player', opponent: side !== 'opponent' },
        }
      : {}),
    preparation: { mode: 'scenario', resources, cohorts: options.cohort ? [side] : [] },
  })
}

function prepareResources(state: FightState, options: Setup): FightState {
  state = prepareEighth(state, options)
  if (options.plant) state = prepareSeed(state, options.side)
  if (options.cohort) state = prepareCohort(state, options.side)
  if (options.bird || options.console || options.offer || options.owl)
    state = prepareSeventh(state, options)
  return state
}
function prepareAbilities(state: FightState, options: Setup): FightState {
  const { side } = options
  if (options.bleed) state = commandMary({ state, side, command: 'bleed' }, performAuraAttack)
  if (options.prologue || options.poem) {
    state = performMove({ state, side, action: 'special' })
    state = advance(state, 61)
  }
  if (options.trueForm) state = performMove({ state, side, action: 'special' })
  return state
}
function prepareSeed(state: FightState, side: FightSide): FightState {
  const seed = state.battlefield?.entities.find(
    (entry) => entry.kind === 'seed' && entry.owner === side,
  )
  if (!seed) throw new Error('Throw demo requires its real scenario seed')
  const victim = side === 'player' ? 'opponent' : 'player'
  state = {
    ...state,
    [side]: { ...state[side], x: seed.x },
    [victim]: { ...state[victim], x: seed.x + state[side].facing * 5 },
  }
  return advance(performMove({ state, side, action: 'special' }), 20)
}
function prepareCohort(state: FightState, side: FightSide): FightState {
  const supporter = state.battlefield?.entities.find(
    (entry) => entry.kind === 'supporter' && entry.owner === side,
  )
  if (!supporter) throw new Error('Throw demo requires real consenting supporters')
  const victim = side === 'player' ? 'opponent' : 'player'
  const x = supporter.x + state[side].facing * 17
  state = {
    ...state,
    [side]: { ...state[side], x },
    [victim]: { ...state[victim], x: x + state[side].facing * 5 },
  }
  return advance(state, COHORT_WILL_FRAMES)
}

/** These are initial scenario conditions at the throw, after all preparation clocks. */
function configureThrow(state: FightState, options: Setup): FightState {
  const { side } = options,
    victim = side === 'player' ? 'opponent' : 'player'
  if (options.miss)
    state = {
      ...state,
      [side]: { ...state[side], x: side === 'player' ? 20 : 80 },
      [victim]: { ...state[victim], x: side === 'player' ? 80 : 20 },
    }
  return {
    ...state,
    [side]: {
      ...state[side],
      ...(options.noNeedles ? { equipment: [] } : {}),
      weaponsConfiscated: Boolean(options.confiscated),
      hatsuEffects: { ...state[side].hatsuEffects, hatsuStolen: options.sealed ? 1 : 0 },
    },
    [victim]: {
      ...state[victim],
      health: options.ko ? 1 : state[victim].health,
      throwTechFrames: options.tech ? THROW_TECH_FRAMES : 0,
    },
  }
}
function advance(state: FightState, frames: number): FightState {
  for (let i = 0; i < frames; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
  return state
}
