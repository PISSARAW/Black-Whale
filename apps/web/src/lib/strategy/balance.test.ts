import { describe, expect, it } from 'vitest'
import { resolveEncounter } from './conflict'
import { initialRelationship, resolveDiplomacy } from './diplomacy'
import { evaluateObjective, strategicRoleForHatsu } from './rules'
import { SCENARIO_MAX_TURNS, scenarioMoveChance } from './scenario'

describe('complete strategy campaign balance', () => {
  it('makes every doctrine achievable by a three-unit faction', () => {
    expect(evaluateObjective('EXPANSION', ['a', 'b', 'c'], 0).complete).toBe(true)
    expect(evaluateObjective('CONSOLIDATION', ['a', 'a', 'c'], 0).complete).toBe(true)
    expect(evaluateObjective('INTELLIGENCE', ['a', 'b', 'c'], 2).complete).toBe(true)
  })

  it('requires preparation before a voluntary pact', () => {
    const neutral = initialRelationship()
    expect(resolveDiplomacy(neutral, 'PROPOSE_PACT').accepted).toBe(false)
    const trusted = resolveDiplomacy(neutral, 'SHARE_INTEL').relationship
    expect(resolveDiplomacy(trusted, 'PROPOSE_PACT').accepted).toBe(true)
  })

  it('eliminates a unit after two adverse encounters', () => {
    const first = resolveEncounter({
      conditions: { player: 'READY', enemy: 'READY' },
      playerIds: ['player'],
      hostileIds: ['enemy'],
      defended: false,
      roll: 0,
    })
    const second = resolveEncounter({
      conditions: first.conditions,
      playerIds: ['player'],
      hostileIds: ['enemy'],
      defended: false,
      roll: 0,
    })
    expect(second.conditions.player).toBe('ELIMINATED')
  })

  it('paces an eight-turn campaign with distinct pressure windows', () => {
    expect(SCENARIO_MAX_TURNS).toBe(8)
    expect(scenarioMoveChance(2)).toBeGreaterThan(scenarioMoveChance(1))
    expect(scenarioMoveChance(6)).toBeLessThan(scenarioMoveChance(1))
  })

  it('covers all three strategic Hatsu effects', () => {
    expect(
      new Set([
        strategicRoleForHatsu('surveillance'),
        strategicRoleForHatsu('portal'),
        strategicRoleForHatsu('chain-bind'),
      ]),
    ).toEqual(new Set(['RECON', 'MOBILITY', 'DENIAL']))
  })
})
