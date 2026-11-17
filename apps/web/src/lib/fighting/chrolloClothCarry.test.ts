import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function advance(state: FightState, frames: number): FightState {
  for (let i = 0; i < frames; i++) {
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  }
  return state
}

function capture(side: FightSide): FightState {
  const other = side === 'player' ? 'opponent' : 'player'
  let state = beginFight(
    createFight(
      side === 'player' ? 'chrollo' : 'hisoka',
      side === 'player' ? 'hisoka' : 'chrollo',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )
  state = {
    ...state,
    [side]: { ...state[side], x: 40, aura: 100 },
    [other]: { ...state[other], x: 45 },
  }
  state = advance(
    performArsenalCommand(state, side, { action: 'history-page', target: 'fun-fun-cloth' }),
    13,
  )
  state = advance(
    performAuraAttack({
      state,
      side,
      kind: 'special',
      moveId: 'chrollo:downSpecial',
      auraCharged: false,
    }),
    24,
  )
  return advance(performArsenalCommand(state, side, { action: 'history-use' }), 20)
}

describe('Fun Fun Cloth carried bodies', () => {
  it.each(['player', 'opponent'] as const)(
    'does not push %s toward a wall while a shrunken body is carried',
    (side) => {
      const other = side === 'player' ? 'opponent' : 'player'
      const held = capture(side)
      expect(held[other].clothCapture?.owner).toBe(side)
      const stationary = advance(held, 180)
      expect(stationary[side].x).toBeCloseTo(held[side].x)
      expect(stationary[other].x).toBeCloseTo(stationary[side].x)
      expect(stationary[other].health).toBe(held[other].health)
      const released = performArsenalCommand(stationary, side, { action: 'history-release' })
      expect(released[other].clothCapture).toBeUndefined()
      expect(Math.abs(released[other].x - released[side].x)).toBe(7)
    },
  )
})
