import { describe, expect, it } from 'vitest'
import { arenaPov } from './pov'
import { beginFight, createFight, performAttack } from '../fighting/engine'
import type { FightAttack } from '../fighting/fightAttackState'
import { initialCombatState } from '../combat/types'

function concealedAttack(): FightAttack {
  return {
    kind: 'ranged',
    frame: 0,
    impacted: false,
    auraCharged: false,
    concealed: true,
    hatsuSource: null,
    projectileSpawned: false,
    reversal: false,
  }
}

describe('the arena POV projection', () => {
  it('masks a concealed opponent attack while the observer has no Gyo and reveals it with Gyo', () => {
    const state = performAttack(
      beginFight(createFight('hisoka', 'kurapika', { mode: 'versus-local' })),
      'player',
      'ranged',
    )
    state.opponent.attack = concealedAttack()

    expect(arenaPov(state, 'player').opponent.attack).toBeNull()

    state.player.nen.gyo = true
    expect(arenaPov(state, 'player').opponent.attack).not.toBeNull()
  })

  it('keeps the canonical simulation state untouched', () => {
    const state = beginFight(createFight('hisoka', 'kurapika', { mode: 'versus-local' }))
    const before = structuredClone(state)
    arenaPov(state, 'player')
    arenaPov(state, 'opponent')
    expect(state).toEqual(before)
  })

  it('projects Arena combat without passing it through the Clash state filter', () => {
    const state = initialCombatState()
    state.opponent.in = true
    state.opponent.intent = {
      zone: 'head',
      remaining: 0.4,
      targetAt: state.player.position,
    }
    const before = structuredClone(state)

    expect(arenaPov(state, 'player').opponent.intent).toBeNull()

    state.player.gyo = true
    expect(arenaPov(state, 'player').opponent.intent?.zone).toBe('head')
    expect(before.opponent.intent?.zone).toBe('head')
  })
})
