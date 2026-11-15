import { describe, expect, it } from 'vitest'
import { beginFight, createFight, opponentAttack, performAttack, tickFight } from './engine'
import { projectileProfile, RANGED_AURA_COST } from './projectiles'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'

function advance(state: FightState, seconds: number, input: FightInput = EMPTY_INPUT): FightState {
  let next = state
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.02) {
    next = tickFight(next, input, 0.02)
  }
  return next
}

function rangedFight(): FightState {
  const state = beginFight(createFight('hisoka', 'kurapika'))
  return {
    ...state,
    player: { ...state.player, x: 24, aura: 80 },
    opponent: { ...state.opponent, x: 76, hitStun: 180 },
  }
}

describe('ranged attacks', () => {
  it('gives a stone to fighters without a canonical projectile', () => {
    expect(projectileProfile('morena')).toMatchObject({
      labelFr: 'Pierre',
      labelEn: 'Stone',
      shape: 'stone',
    })
    expect(projectileProfile('chrollo').shape).toBe('stone')
    expect(projectileProfile('biscuit').shape).toBe('stone')
    expect(projectileProfile('hisoka').shape).toBe('card')
    expect(projectileProfile('theta').shape).toBe('orb')
  })

  it('spawns a travelling projectile before applying damage', () => {
    const ready = rangedFight()
    const armed = performAttack(ready, 'player', 'ranged')
    expect(armed.player.aura).toBe(80 - RANGED_AURA_COST)
    expect(armed.projectiles).toHaveLength(0)

    const flying = advance(armed, 0.24)
    expect(flying.projectiles).toHaveLength(1)
    expect(flying.opponent.health).toBe(100)

    const struck = advance(flying, 1)
    expect(struck.opponent.health).toBeLessThan(100)
    expect(struck.impact).toMatchObject({ kind: 'ranged', attacker: 'player' })
  })

  it('lets a jump clear a projectile', () => {
    let state = beginFight(createFight('kurapika', 'hisoka'))
    state = {
      ...state,
      player: { ...state.player, x: 42 },
      opponent: { ...state.opponent, x: 60, hitStun: 90 },
    }
    state = performAttack(state, 'opponent', 'ranged')
    const cleared = advance(state, 0.8, { ...EMPTY_INPUT, jump: true })
    expect(cleared.player.health).toBe(100)
    expect(cleared.projectiles).toHaveLength(0)
  })

  it('uses the normal guard and parry rules on impact', () => {
    let state = beginFight(createFight('kurapika', 'hisoka'))
    state = {
      ...state,
      player: { ...state.player, x: 46 },
      opponent: { ...state.opponent, x: 54 },
    }
    state = performAttack(state, 'opponent', 'ranged')
    let incoming = state
    while (incoming.projectiles.length === 0) incoming = advance(incoming, 0.02)
    const parried = advance(incoming, 0.06, { ...EMPTY_INPUT, guard: true })
    expect(parried.impact).toMatchObject({
      kind: 'ranged',
      blocked: true,
      parried: true,
      damage: 0,
    })
  })

  it('makes the AI fire beyond its preferred range', () => {
    const state = beginFight(createFight('kurapika', 'morena'))
    const armed = opponentAttack(state)
    expect(armed.opponent.attack?.kind).toBe('ranged')
  })
})
