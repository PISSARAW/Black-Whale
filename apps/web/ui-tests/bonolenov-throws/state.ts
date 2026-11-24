import {
  beginFight,
  createFight,
  performAuraAttack,
  performThrow,
  tickFight,
} from '$lib/fighting/engine'
import { BATTLE_MOVES } from '$lib/fighting/battleCantabileTypes'
import { EMPTY_INPUT, type FightSide, type FightState } from '$lib/fighting/types'

export interface ThrowOptions {
  side?: FightSide
  armed?: boolean
  powered?: boolean
  miss?: boolean
  tech?: boolean
  ko?: boolean
  aura?: number
  zetsu?: boolean
}
export const tick = (state: FightState) =>
  tickFight(state, EMPTY_INPUT, {
    dt: 1 / 60,
    opponentInput: EMPTY_INPUT,
    ai: false,
  })

/** Native commands and actor ticks prepare the prop and confirm the grab. */
export function prepareBonolenovThrow(options: ThrowOptions = {}) {
  const side = options.side ?? 'player'
  const victim = side === 'player' ? 'opponent' : 'player'
  let state = beginFight(
    createFight(
      side === 'player' ? 'bonolenov' : 'hisoka',
      side === 'opponent' ? 'bonolenov' : 'hisoka',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )
  state = {
    ...state,
    player: { ...state.player, x: 46, aura: 100 },
    opponent: { ...state.opponent, x: 51, aura: 100 },
  }
  if (options.armed) {
    state = performAuraAttack({
      state,
      side,
      kind: 'special',
      moveId: BATTLE_MOVES.prologue,
      auraCharged: false,
    })
    for (let i = 0; i < 60; i++) state = tick(state)
  }
  state = {
    ...state,
    [victim]: {
      ...state[victim],
      x: options.miss ? (side === 'player' ? 85 : 15) : state[victim].x,
      health: options.ko ? 1 : state[victim].health,
      throwTechFrames: options.tech ? 8 : 0,
    },
    [side]: {
      ...state[side],
      aura: options.aura ?? state[side].aura,
      nen: options.zetsu ? { ...state[side].nen, mode: 'zetsu' } : state[side].nen,
    },
  }
  const before = state
  state = performThrow(state, side, { ...EMPTY_INPUT, aura: Boolean(options.powered) })
  const tape = [state]
  for (let i = 0; i < 125; i++) {
    state = tick(state)
    tape.push(state)
  }
  return { before, tape, side, victim }
}
