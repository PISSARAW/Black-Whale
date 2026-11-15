import { describe, expect, it } from 'vitest'
import { HATSU_PROFILES } from '../../nen/hatsuRegistry'
import { arenaHatsuEffect, worksInArena } from '../hatsu'
import { arenaDefinition } from './contract'
import { BLACK_WHALE_ARENA_CONTRACTS } from './blackWhale'

describe('the 32 Black Whale Arena Hatsu', () => {
  it('registers exactly 32 distinct, canonical profiles', () => {
    expect(BLACK_WHALE_ARENA_CONTRACTS).toHaveLength(32)
    expect(new Set(BLACK_WHALE_ARENA_CONTRACTS.map(({ id }) => id)).size).toBe(32)
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

  it('adds combatants with both offensive and defensive Hatsu', () => {
    const additions = [
      'emperor-time',
      'chain-jail',
      'melody-enchanting-music',
      'dance-of-the-serpents-bite',
      'padaille-weapon-transformation',
      'snake-arm',
      'grimmel-the-dissonance',
      'cross-game',
    ]
    expect(BLACK_WHALE_ARENA_CONTRACTS.filter(({ id }) => additions.includes(id))).toHaveLength(8)
  })
})
