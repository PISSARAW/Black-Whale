import { expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAttack, tickFight } from './engine'
import {
  advanceNenMentalFatigue,
  nenCognitiveBaseCapacity,
  nenCognitiveCapacity,
} from './nenCognitiveLoad'
import { nenTransferFrames } from './nenTransfer'
import { EMPTY_INPUT, type FightState } from './types'

function overloadedFranklin(): FightState {
  let state = beginFight(createFight('franklin', 'hisoka', { mode: 'versus-local' }))
  state = {
    ...state,
    player: { ...state.player, aura: 100, x: 20 },
    opponent: { ...state.opponent, x: 80 },
  }
  state = performAttack(state, 'player', 'ranged')
  for (let frame = 0; frame < 50 && !state.projectiles.length; frame += 1)
    state = tickFight(state, EMPTY_INPUT, {
      dt: 1 / 60,
      ai: false,
      opponentInput: EMPTY_INPUT,
    })
  const shot = state.projectiles[0]
  return {
    ...state,
    player: { ...state.player, attack: null, bufferedAttack: null },
    projectiles: Array.from({ length: 8 }, (_, index) => ({ ...shot, id: index + 1 })),
  }
}

it('accumulates quantised fatigue deterministically but not in forecasts or hitstop', () => {
  const state = overloadedFranklin()
  const first = advanceNenMentalFatigue(state)
  expect(first.player.nenMentalFatigue ?? 0).toBeGreaterThan(state.player.nenMentalFatigue ?? 0)
  expect(advanceNenMentalFatigue(state)).toEqual(first)
  expect(advanceNenMentalFatigue({ ...state, forecastSimulation: true })).toEqual({
    ...state,
    forecastSimulation: true,
  })

  const frozen = tickFight({ ...state, hitstop: 1 }, EMPTY_INPUT, {
    dt: 1 / 60,
    ai: false,
    opponentInput: EMPTY_INPUT,
  })
  expect(frozen.player.nenMentalFatigue).toBe(state.player.nenMentalFatigue)
})

it('recovers slowly in Zetsu instead of clearing fatigue', () => {
  const state = beginFight(createFight('hisoka', 'franklin', { mode: 'versus-local' }))
  state.player = {
    ...state.player,
    nenMentalFatigue: 5_000,
    nen: { ...state.player.nen, mode: 'zetsu' },
  }
  const recovered = advanceNenMentalFatigue(state)
  expect(recovered.player.nenMentalFatigue).toBe(4_999)
})

it('reduces cognitive capacity, slows Ryu and retains 75% between rounds', () => {
  const state = beginFight(createFight('hisoka', 'franklin', { mode: 'versus-local' }))
  const tired = { ...state, player: { ...state.player, nenMentalFatigue: 8_000 } }
  expect(nenCognitiveCapacity(tired, 'player')).toBeLessThan(
    nenCognitiveBaseCapacity(tired, 'player'),
  )
  expect(nenTransferFrames(tired.player)).toBeGreaterThan(nenTransferFrames(state.player))

  const next = nextRound({ ...tired, phase: 'finished', winner: 'player' })
  expect(next.player.nenMentalFatigue).toBe(6_000)
})
