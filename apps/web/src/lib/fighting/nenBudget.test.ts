import { expect, it } from 'vitest'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { EMPTY_INPUT } from './types'
import { readNenBudget, withNenBudgets, nenBodyOutput, nenOutputAllows } from './nenBudget'
import { nenDamageFactor } from './nen'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s has independent reserve, output and current commitments',
  (id) => {
    const state = beginFight(createFight(id, 'hisoka'))
    const before = structuredClone(state),
      budget = readNenBudget(state, 'player')
    expect(budget.capacity).toBeGreaterThan(60)
    expect(budget.capacity).toBeLessThanOrEqual(100)
    expect(budget.available).toBe(budget.capacity)
    expect(
      readNenBudget({ ...state, player: { ...state.player, aura: 5 } }, 'player').capacity,
    ).toBe(budget.capacity)
    expect(state).toEqual(before)
  },
)

it('accounts for a real Franklin emission until it expires, without spending its reserve twice', () => {
  let state = beginFight(createFight('franklin', 'hisoka', { mode: 'versus-local' }))
  state = { ...state, player: { ...state.player, x: 20 }, opponent: { ...state.opponent, x: 80 } }
  state = performAttack(state, 'player', 'ranged')
  for (let i = 0; i < 50 && !state.projectiles.length; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
  expect(state.projectiles.length).toBeGreaterThan(0)
  expect(readNenBudget(state, 'player').detached).toBeGreaterThan(0)
  const budgeted = withNenBudgets(state)
  expect(budgeted.player.aura).toBe(state.player.aura)
  expect(nenBodyOutput(budgeted.player)).toBeLessThan(1)
  expect(nenDamageFactor(budgeted.player, 'torso')).toBeGreaterThan(
    nenDamageFactor({ ...state.player, nenBudget: undefined }, 'torso'),
  )
  const released = withNenBudgets({ ...state, projectiles: [] })
  expect(nenBodyOutput(released.player)).toBe(1)
  expect(released.player.aura).toBe(state.player.aura)
  expect(
    nenOutputAllows(
      { ...budgeted.player, nenBudget: { ...budgeted.player.nenBudget!, available: 0 } },
      10,
    ),
  ).toBe(false)
})
