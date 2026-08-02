import { describe, expect, it } from 'vitest'
import { HATSU_PROFILES } from '../../nen/hatsuRegistry'
import { arenaHatsuEffect, worksInArena } from '../hatsu'
import { arenaDefinition } from './contract'
import { BLACK_WHALE_ARENA_CONTRACTS } from './blackWhale'

describe('the 24 Black Whale Arena Hatsu', () => {
  it('registers exactly 24 distinct, canonical profiles', () => {
    expect(BLACK_WHALE_ARENA_CONTRACTS).toHaveLength(24)
    expect(new Set(BLACK_WHALE_ARENA_CONTRACTS.map(({ id }) => id)).size).toBe(24)
    for (const contract of BLACK_WHALE_ARENA_CONTRACTS) {
      expect(
        HATSU_PROFILES.some(({ id }) => id === contract.id),
        contract.id,
      ).toBe(true)
    }
  })

  it('makes every profile selectable and mechanically individualized', () => {
    for (const contract of BLACK_WHALE_ARENA_CONTRACTS) {
      const profile = HATSU_PROFILES.find(({ id }) => id === contract.id)!
      expect(worksInArena(profile.kind), contract.id).toBe(true)
      expect(arenaHatsuEffect(profile), contract.id).toBe(contract.effect)
      expect(arenaDefinition(profile), contract.id).toMatchObject({
        mechanic: contract.mechanic,
        condition: expect.any(String),
        risk: expect.any(String),
      })
    }
  })
})
