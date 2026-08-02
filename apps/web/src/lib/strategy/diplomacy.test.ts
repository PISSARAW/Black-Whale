import { describe, expect, it } from 'vitest'
import { diplomacyCost, initialRelationship, resolveDiplomacy } from './diplomacy'

describe('strategy diplomacy', () => {
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
