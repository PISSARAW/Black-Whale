import { describe, expect, it } from 'vitest'
import {
  diplomacyCost,
  initialRelationship,
  resolveDiplomacy,
  resolveDiplomacyPlan,
} from './diplomacy'

describe('strategy diplomacy', () => {
  it('accepts the store’s reactive relationships, which structuredClone refuses', () => {
    // A Svelte $state value is a Proxy; structuredClone throws DataCloneError
    // on one, and that used to fail every turn before any order was applied.
    const reactive = new Proxy({ rival: new Proxy(initialRelationship(), {}) }, {})
    expect(() => structuredClone(reactive)).toThrow()
    const plan = resolveDiplomacyPlan({
      relationships: reactive,
      orders: [{ factionId: 'rival', action: 'SHARE_INTEL' }],
      activeFactionIds: ['player', 'rival'],
      playerFactionId: 'player',
      factionNames: { rival: 'Rival' },
    })
    expect(plan.error).toBeUndefined()
    expect(plan.relationships.rival.trust).toBe(25)
    expect(reactive.rival.trust).toBe(0)
  })

  it('builds trust before accepting a pact', () => {
    const first = resolveDiplomacy(initialRelationship(), 'PROPOSE_PACT')
    expect(first.accepted).toBe(false)
    const trusted = resolveDiplomacy(initialRelationship(), 'SHARE_INTEL').relationship
    expect(resolveDiplomacy(trusted, 'PROPOSE_PACT').relationship.pact).toBe(true)
  })

  it('makes betrayal permanent', () => {
    const pact = { trust: 40, fear: 0, pact: true, betrayed: false }
    const betrayed = resolveDiplomacy(pact, 'BETRAY').relationship
    expect(betrayed.trust).toBe(-100)
    expect(resolveDiplomacy(betrayed, 'PROPOSE_PACT').accepted).toBe(false)
  })

  it('charges diplomacy against the turn budget', () => {
    expect(
      diplomacyCost([
        { factionId: 'a', action: 'SHARE_INTEL' },
        { factionId: 'b', action: 'PROPOSE_PACT' },
      ]),
    ).toBe(3)
  })
})
