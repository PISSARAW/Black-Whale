import { EMPTY_INPUT, type FightState, type FightSide } from '$lib/fighting/types'
import { performMove, performAuraAttack, tickFight } from '$lib/fighting/engine'
import { performSweetHomeCommand } from '$lib/fighting/sweetHomeArsenal'
import type { PadailleTool } from '$lib/fighting/padailleWeapon'

export interface EighthPreparation {
  side: FightSide
  tool?: PadailleTool
  animal?: boolean
  relay?: boolean
  threshold?: boolean
  door?: boolean
  guards?: boolean
}
/** Native commands pay and prepare each ability; positioning only sets up the capture stage. */
export function prepareEighth(state: FightState, options: EighthPreparation): FightState {
  if (options.tool) state = prepareTool(state, options)
  if (options.animal) state = prepareAnimal(state, options.side)
  if (options.relay) state = prepareRecipient(state, options.side)
  if (options.threshold || options.door) state = prepareDoor(state, options)
  if (options.guards) state = prepareGuards(state, options.side)
  return state
}
function place(state: FightState, side: FightSide, x: number): FightState {
  const victim = side === 'player' ? 'opponent' : 'player'
  return {
    ...state,
    [side]: { ...state[side], x },
    [victim]: { ...state[victim], x: x + state[side].facing * 5 },
  }
}
function advance(state: FightState, frames: number): FightState {
  for (let i = 0; i < frames; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
  return state
}
function prepareTool(state: FightState, options: EighthPreparation) {
  const { side } = options,
    victim = side === 'player' ? 'opponent' : 'player'
  const x = state[victim].x
  const moves = { hammer: 'neutralSpecial', drill: 'forwardSpecial', axe: 'downSpecial' }
  state = { ...state, [victim]: { ...state[victim], x: side === 'player' ? 90 : 10 } }
  state = performAuraAttack({
    state,
    side,
    kind: 'special',
    moveId: `padaille:${moves[options.tool!]}`,
    auraCharged: false,
  })
  state = advance(state, 65)
  return { ...state, [victim]: { ...state[victim], x } }
}
function prepareAnimal(state: FightState, side: FightSide) {
  const animal = state.battlefield?.entities.find(
    (entry) => entry.kind === 'animal' && entry.owner === side,
  )
  if (!animal) return state
  state = place(state, side, animal.x - state[side].facing * 2)
  return advance(performMove({ state, side, action: 'special' }), 20)
}
function prepareRecipient(state: FightState, side: FightSide) {
  const crate = state.battlefield?.entities.find(
    (entry) => entry.kind === 'crate' && entry.owner === side,
  )
  if (!crate) return state
  state = place(state, side, crate.x - state[side].facing * 4)
  return performSweetHomeCommand(state, side, { action: 'sweet-home-object', target: crate.id })
}
function prepareDoor(state: FightState, options: EighthPreparation) {
  const { side } = options
  state = place(state, side, side === 'player' ? 34 : 66)
  return options.door ? advance(performMove({ state, side, action: 'special' }), 45) : state
}
function prepareGuards(state: FightState, side: FightSide) {
  state = place(state, side, side === 'player' ? 10 : 90)
  const victim = side === 'player' ? 'opponent' : 'player'
  state = { ...state, [victim]: { ...state[victim], x: side === 'player' ? 80 : 20 } }
  state = performMove({ state, side, action: 'special' })
  return place(state, side, 50)
}
