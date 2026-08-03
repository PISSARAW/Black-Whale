import { describe, expect, it } from 'vitest'
import { combatReducer, initialCombatState } from '../../combat/reducer'
import type { CombatState } from '../../combat/types'
import { HATSU_PROFILES, HATSU_VISUAL_SIGNATURE_BY_KIND } from '../../nen/hatsuRegistry'
import { arenaHatsuAudioSignature } from '../audio'
import { BLACK_WHALE_ARENA_CONTRACTS } from './blackWhale'

describe('production treatment for 24 Black Whale Hatsu', () => {
  it('assigns a TourSense visual and a dedicated two-tone sound to every Hatsu', () => {
    const sounds = new Set<string>()
    for (const contract of BLACK_WHALE_ARENA_CONTRACTS) {
      const profile = HATSU_PROFILES.find(({ id }) => id === contract.id)!
      const visual = HATSU_VISUAL_SIGNATURE_BY_KIND[profile.kind]
      expect(visual.manifestation, contract.id).toBeTruthy()
      const sound = arenaHatsuAudioSignature(profile)
      sounds.add(`${sound.base}:${sound.accent}:${sound.duration}:${sound.wave}`)
    }
    expect(sounds.size).toBe(24)
  })

  it('executes a specialized state interaction for every contract', () => {
    for (const contract of BLACK_WHALE_ARENA_CONTRACTS) {
      const initial = scenario(contract.id)
      const next = combatReducer(initial, {
        type: 'HATSU',
        side: 'player',
        effect: contract.effect,
        zone: 'torso',
        hatsuId: contract.id,
        cost: 0,
      })
      expect(next, contract.id).not.toEqual(initial)
    }
  })

  it('preserves signature tactical differences', () => {
    const base = scenario('base')
    const future = cast(base, 'parallel-future')
    const predator = cast(base, 'rihan-predator')
    const steal = cast(base, 'steal-chain')
    expect(future.player.position).not.toEqual(base.player.position)
    expect(future.player.mode).toBe('zetsu')
    expect(predator.opponent.empowered).toBe(0)
    expect(steal.opponent.mode).toBe('zetsu')
    expect(steal.opponent.aura).toBeLessThan(base.opponent.aura)
  })
})

function cast(state: CombatState, id: string): CombatState {
  const contract = BLACK_WHALE_ARENA_CONTRACTS.find((entry) => entry.id === id)!
  return combatReducer(state, {
    type: 'HATSU',
    side: 'player',
    effect: contract.effect,
    zone: 'torso',
    hatsuId: id,
    cost: 0,
  })
}

function scenario(id: string): CombatState {
  const state = initialCombatState({
    playerAt: [0, 0],
    opponentAt: [2, 0],
    terrain: {
      id: 'hatsu-test',
      footprint: [
        [-20, -20],
        [20, -20],
        [20, 20],
        [-20, 20],
      ],
      walls: [],
    },
  })
  if (id === 'cats-name')
    return { ...state, player: { ...state.player, condition: 'down', recovery: 2, aura: 10 } }
  if (id === 'pain-packer') return { ...state, player: { ...state.player, aura: 35 } }
  return state
}
