import { describe, expect, it } from 'vitest'
import { rememberBodyHit } from '../bodyMemory'
import { createFightState } from '../fightState'
import type { FightImpact } from '../types'
import { resolveImpactCallout } from './tacticalCallout'

function makeImpact(overrides: Partial<FightImpact> = {}): FightImpact {
  return {
    attacker: 'player',
    kind: 'light',
    damage: 14,
    damageScale: 1,
    points: 1,
    zone: 'torso',
    concealed: false,
    projectileId: null,
    position: { x: 50, y: 0 },
    blocked: false,
    parried: false,
    avoided: false,
    invulnerable: false,
    counterHit: false,
    punish: false,
    antiAir: false,
    wallSplat: false,
    comboHits: 1,
    critical: false,
    knockdown: false,
    sequence: 1,
    ...overrides,
  }
}

describe('resolveImpactCallout', () => {
  it('preserves numeric damage and points in omniscient mode', () => {
    const state = createFightState('kurapika', 'hisoka')
    state.impact = makeImpact({ damage: 32, points: 2, counterHit: true })

    expect(resolveImpactCallout({ state, language: 'fr', mode: 'omniscient' })).toBe(
      'COUNTER · -32 · +2',
    )
  })

  it('strips all damage numbers in tactical mode and uses sensory cues', () => {
    const state = createFightState('kurapika', 'hisoka')
    state.impact = makeImpact({ damage: 14, blocked: false })
    expect(resolveImpactCallout({ state, language: 'fr', mode: 'tactical' })).toBe('COUP FRANC')

    state.impact = makeImpact({ damage: 28, critical: true, knockdown: true })
    expect(resolveImpactCallout({ state, language: 'fr', mode: 'tactical' })).toBe(
      'IMPACT LOURD · CHUTE',
    )

    state.impact = makeImpact({ damage: 0, blocked: true })
    expect(resolveImpactCallout({ state, language: 'fr', mode: 'tactical' })).toBe(
      'SON CREUX · KEN',
    )

    state.impact = makeImpact({ damage: 4, blocked: true })
    expect(resolveImpactCallout({ state, language: 'en', mode: 'tactical' })).toBe('CUSHIONED')
  })

  it('adds weakened-limb confirmation at Level 2 perception', () => {
    const state = createFightState('kurapika', 'hisoka')
    for (let i = 0; i < 3; i++) {
      state.opponent = rememberBodyHit(state.opponent, 'hands', 10, false)
    }
    state.impact = makeImpact({ damage: 12 })

    // Level 0: no weakened-limb confirmation
    expect(resolveImpactCallout({ state, language: 'fr', mode: 'tactical' })).toBe('COUP FRANC')

    // Level 2 (full Gyo): confirms weakened limb
    state.player.nen.gyo = true
    expect(resolveImpactCallout({ state, language: 'fr', mode: 'tactical' })).toBe(
      'COUP FRANC · ZONE FRAGILISÉE',
    )
  })

  it('lets P2 confirm a weakened limb in local versus, but never the AI', () => {
    const state = createFightState('kurapika', 'hisoka')
    for (let i = 0; i < 3; i++) {
      state.player = rememberBodyHit(state.player, 'feet', 10, false)
    }
    state.opponent.nen.gyo = true
    state.impact = makeImpact({ attacker: 'opponent', damage: 12 })

    expect(resolveImpactCallout({ state, language: 'fr', mode: 'tactical' })).toBe('COUP FRANC')
    state.mode = 'versus-local'
    expect(resolveImpactCallout({ state, language: 'fr', mode: 'tactical' })).toBe(
      'COUP FRANC · ZONE FRAGILISÉE',
    )
  })
})
