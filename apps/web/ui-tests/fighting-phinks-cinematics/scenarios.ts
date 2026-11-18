import {
  beginFight,
  createFight,
  performAttack,
  performMove,
  tickFight,
} from '$lib/fighting/engine'
import { otherSide } from '$lib/fighting/frameData'
import { EMPTY_INPUT, type FightSide, type FightState } from '$lib/fighting/types'

export type PhinksScenario =
  'rotations' | 'hit' | 'one-turn' | 'block' | 'miss' | 'interrupted' | 'partial' | 'ordinary'
export function advancePhinks(state: FightState, frames: number, mode: PhinksScenario): FightState {
  const owner: FightSide = state.player.id === 'phinks' ? 'player' : 'opponent'
  const input = { ...EMPTY_INPUT, guard: mode === 'block' }
  for (let i = 0; i < frames; i++)
    state = tickFight(state, owner === 'opponent' ? input : EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: owner === 'player' ? input : EMPTY_INPUT,
    })
  return state
}
export function createPhinksScenario(
  mode: PhinksScenario,
  owner: FightSide = 'player',
): FightState {
  const base = beginFight(
    createFight(
      owner === 'player' ? 'phinks' : 'hisoka',
      owner === 'opponent' ? 'phinks' : 'hisoka',
      { mode: 'versus-local', formatId: 'knockout', environment: { stageId: 'heavens-arena' } },
    ),
  )
  const target = otherSide(owner),
    x = owner === 'player' ? 42 : 58
  let state: FightState = {
    ...base,
    [owner]: { ...base[owner], x, aura: 100 },
    [target]: {
      ...base[target],
      x: x + base[owner].facing * (mode === 'miss' ? 38 : 6),
      aura: 100,
    },
  }
  if (mode === 'rotations') return state
  state = performAttack(state, owner, 'special')
  state = advancePhinks(state, mode === 'partial' ? 35 : mode === 'one-turn' ? 36 : 108, mode)
  return performAttack(state, owner, 'special')
}
export function actPhinks(state: FightState, mode: PhinksScenario, owner: FightSide): FightState {
  if (mode === 'partial') return state
  if (mode === 'rotations') return performAttack(state, owner, 'special')
  if (mode === 'ordinary') return performAttack(state, owner, 'heavy')
  const released = performMove({ state, side: owner, action: 'finisher' })
  return mode === 'interrupted' ? performAttack(released, otherSide(owner), 'light') : released
}
