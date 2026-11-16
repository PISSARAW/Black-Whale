import { createFightState } from './fightState'
import type { FightSide, FightState } from './types'
import type { TrainingPosition, TrainingResources, TrainingSettings } from './trainingTypes'

export function resetTraining(
  state: FightState,
  position: TrainingPosition = 'center',
): FightState {
  if (state.mode !== 'training' || !state.training) return state
  const fresh = createFightState(state.player.id, state.opponent.id, {
    formatId: state.formatId,
    mode: 'training',
    environment: state.environment,
  })
  const positions = { center: [44, 56], left: [7, 19], right: [81, 93] }[position]
  const recording = state.training.recording
  const next: FightState = {
    ...fresh,
    phase: 'fighting',
    player: { ...fresh.player, x: positions[0] },
    opponent: { ...fresh.opponent, x: positions[1] },
    training: {
      ...fresh.training!,
      settings: state.training.settings,
      recording: { ...recording, recording: false, playing: false, index: 0, start: 0 },
    },
  }
  return applyInitialResources(next)
}

export function setTrainingResources(
  state: FightState,
  side: FightSide,
  update: Partial<TrainingResources>,
): FightState {
  if (!state.training || state.mode !== 'training') return state
  const old = state.training.settings.resources[side]
  const resources = {
    ...old,
    ...update,
    health: bounded(update.health ?? old.health, 1, state[side].maxHealth),
    aura: bounded(update.aura ?? old.aura, 0, 100),
  }
  const next = {
    ...state,
    training: {
      ...state.training,
      settings: {
        ...state.training.settings,
        resources: { ...state.training.settings.resources, [side]: resources },
      },
    },
  }
  const fighter = next[side]
  return {
    ...next,
    [side]: {
      ...fighter,
      health: update.health === undefined ? fighter.health : resources.health,
      aura: update.aura === undefined ? fighter.aura : resources.aura,
      auraExhausted: update.aura === undefined ? fighter.auraExhausted : resources.aura === 0,
    },
    training: { ...next.training, measurement: undefined },
  }
}

export function setTrainingDummy(
  state: FightState,
  update: Partial<TrainingSettings['dummy']>,
): FightState {
  if (!state.training || state.mode !== 'training') return state
  const dummy = { ...state.training.settings.dummy, ...update }
  dummy.delay = bounded(dummy.delay, 0, 120)
  return {
    ...state,
    training: {
      ...state.training,
      reversalArmed: false,
      readyFrames: 0,
      settings: { ...state.training.settings, dummy },
    },
  }
}

export function enforceTrainingResources(state: FightState): FightState {
  if (!state.training || state.mode !== 'training' || state.forecastSimulation) return state
  if (state.catsName) return state
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const setting = state.training.settings.resources[side]
    const fighter = next[side]
    next = {
      ...next,
      [side]: {
        ...fighter,
        health: setting.infiniteHealth ? setting.health : fighter.health,
        aura: setting.infiniteAura ? setting.aura : fighter.aura,
        auraExhausted: setting.infiniteAura ? setting.aura === 0 : fighter.auraExhausted,
      },
    }
  }
  return next
}

function applyInitialResources(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const resources = state.training!.settings.resources[side]
    next = {
      ...next,
      [side]: {
        ...next[side],
        health: resources.health,
        aura: resources.aura,
        auraExhausted: resources.aura === 0,
      },
    }
  }
  return next
}

function bounded(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.round(Math.max(min, Math.min(max, value))) : min
}
