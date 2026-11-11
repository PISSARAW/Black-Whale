import { describe, expect, it } from 'vitest'
import { arenaDefinition } from '../arena/hatsu/contract'
import { hatsuById } from '../nen/hatsuRegistry'
import { INFILTRATION_HATSU } from './hatsu'

describe('shared Nen contracts in infiltration', () => {
  it('takes executable costs and conditions from ability modules when available', () => {
    for (const ability of INFILTRATION_HATSU) {
      const contract = arenaDefinition(hatsuById(ability.id))
      if (!contract) continue
      expect(ability.cost, ability.id).toBe(contract.cost)
      expect(ability.activationCondition, ability.id).toBe(contract.condition)
      expect(ability.risk, ability.id).toBe(contract.risk)
      expect(ability.contractSource, ability.id).toBe('ability-module')
    }
  })

  it('keeps the canonical cost visible even for mode-specific adapters', () => {
    for (const ability of INFILTRATION_HATSU) {
      expect(ability.canonicalCost.length, ability.id).toBeGreaterThan(3)
    }
  })
})
