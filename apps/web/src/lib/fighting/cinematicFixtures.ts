import { commandMary } from './bloodyMaryAction'
import { performAuraAttack } from './engine'
import { beginFight, createFight, performAttack, performMove, tickFight } from './engine'
import { recordFightInjuries } from './feitanPain'
import { EMPTY_INPUT } from './types'
import type { FightSide, FightState, FighterId } from './types'

/** Engine-driven presentation fixtures: resources are declared before combat, never fabricated hits. */
export function cinematicDuel(
  id: FighterId,
  side: FightSide = 'player',
  options: { preparePredatorPrey?: boolean } = {},
): FightState {
  const state = cinematicStartingState(id, side)
  return id === 'rihan' && options.preparePredatorPrey === false
    ? state
    : prepareAction(state, id, side)
}

function cinematicStartingState(id: FighterId, side: FightSide): FightState {
  const other: FightSide = side === 'player' ? 'opponent' : 'player'
  const adversary = id === 'rihan' ? 'hisoka' : 'chrollo'
  const state = beginFight(
    createFight(side === 'player' ? id : adversary, side === 'opponent' ? id : adversary, {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        stageId: cinematicStage(id),
        morenaPresent: true,
        unlawfulIntruders: { player: side !== 'player', opponent: side !== 'opponent' },
        preparation: {
          mode: 'scenario',
          resources: ['animals', 'birds', 'plants', 'rooms', 'flutes', 'needles'],
          cohorts: ['player', 'opponent'],
        },
      },
    }),
  )
  const entity = state.battlefield?.entities.find(
    (e) => e.owner === side && e.kind === preparedKind(id),
  )
  const x = entity?.x ?? 48
  return {
    ...state,
    [side]: { ...state[side], x, aura: 100 },
    [other]: { ...state[other], x: x + state[side].facing * 5, aura: 100 },
  }
}
function cinematicStage(id: FighterId) {
  return id === 'yokotani' ? ('heilly-hideout' as const) : ('heavens-arena' as const)
}
function prepareAction(state: FightState, id: FighterId, side: FightSide): FightState {
  if (['feitan', 'terebellum', 'machi'].includes(id))
    state = recordFightInjuries(state, {
      ...state,
      [side]: {
        ...state[side],
        health: state[side].health - 35,
        openWounds: id === 'machi' ? 1 : state[side].openWounds,
      },
    })
  if (id === 'halkenburg') for (let i = 0; i < 480; i++) state = cinematicStep(state)
  if (id === 'rihan') {
    state = performAttack(state, side === 'player' ? 'opponent' : 'player', 'special')
    for (let i = 0; i < 45; i++) state = cinematicStep(state)
  }
  if (id === 'zakuro') state = commandMary({ state, side, command: 'bleed' }, performAuraAttack)
  return recovered(state, side)
}
function recovered(state: FightState, side: FightSide): FightState {
  for (let i = 0; i < 120 && (state[side].hitStun > 0 || state[side].knockdownFrames > 0); i++)
    state = cinematicStep(state)
  return state
}
function preparedKind(id: FighterId) {
  const kinds: Partial<Record<FighterId, string>> = {
    sayird: 'animal',
    cluck: 'bird',
    bill: 'seed',
    luini: 'room',
  }
  return kinds[id]
}
export function cinematicStep(state: FightState): FightState {
  return tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
}
export function cinematicCommand(state: FightState, side: FightSide = 'player'): FightState {
  return ['theta', 'camilla'].includes(state[side].id)
    ? performAttack(state, side, 'ranged')
    : performMove({ state, side, action: 'special' })
}
