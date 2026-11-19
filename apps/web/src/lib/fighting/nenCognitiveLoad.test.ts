import { expect, it } from 'vitest'
import { beginFight, createFight, performAttack, performAuraAttack, tickFight } from './engine'
import {
  nenCognitiveActionCost,
  nenCognitiveAllows,
  readNenCognitiveLoad,
} from './nenCognitiveLoad'
import { focusNenZone } from './nenAdvanced'
import { EMPTY_INPUT } from './types'
import { commandFailure } from './commandFailure'

it('derives stable cognitive load from live Nen without mutating the rollback state', () => {
  const state = beginFight(createFight('biscuit', 'hisoka', { mode: 'versus-local' }))
  state.player = focusNenZone(focusNenZone(state.player, 'feet'), 'hands')
  state.player = {
    ...state.player,
    nen: { ...state.player.nen, gyo: true, in: true },
  }
  const before = structuredClone(state)
  const first = readNenCognitiveLoad(state, 'player')
  const second = readNenCognitiveLoad(state, 'player')

  expect(first).toEqual(second)
  expect(first.commitments.map(({ id }) => id)).toEqual(
    expect.arrayContaining(['gyo', 'in', 'ryu-transfer']),
  )
  expect(first.load).toBeGreaterThan(0)
  expect(first.overloaded).toBe(false)
  expect(state).toEqual(before)
})

it('makes simultaneous detached Nen non-linear and rejects only new Nen when overloaded', () => {
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
  expect(shot).toBeDefined()
  state = {
    ...state,
    player: { ...state.player, attack: null, bufferedAttack: null, aura: 100 },
    projectiles: Array.from({ length: 8 }, (_, index) => ({ ...shot, id: index + 1 })),
  }
  const cognitive = readNenCognitiveLoad(state, 'player')
  expect(cognitive.overloaded).toBe(true)
  expect(nenCognitiveAllows(state, 'player', { kind: 'special' })).toBe(false)
  expect(commandFailure(state, { side: 'player', action: 'special' })).toBe('overload')

  const hatsu = performAuraAttack({
    state,
    side: 'player',
    kind: 'special',
    auraCharged: false,
  })
  expect(hatsu).toBe(state)
  const physical = performAuraAttack({
    state,
    side: 'player',
    kind: 'light',
    auraCharged: false,
  })
  expect(physical.player.attack?.kind).toBe('light')
})

it('charges unfamiliar borrowed Hatsu more than a native operation', () => {
  const native = beginFight(createFight('hisoka', 'chrollo', { mode: 'versus-local' }))
  const borrowed = {
    ...native,
    player: { ...native.player, nenOwner: 'chrollo' as const },
  }
  const action = { kind: 'special' as const }
  expect(nenCognitiveActionCost(borrowed, 'player', action)).toBeGreaterThan(
    nenCognitiveActionCost(native, 'player', action),
  )
})
