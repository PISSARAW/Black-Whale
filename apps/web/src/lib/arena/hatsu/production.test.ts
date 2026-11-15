import { describe, expect, it } from 'vitest'
import { combatReducer, initialCombatState } from '../../combat/reducer'
import type { CombatState } from '../../combat/types'
import { HATSU_PROFILES, HATSU_VISUAL_SIGNATURE_BY_KIND } from '../../nen/hatsuRegistry'
import { arenaHatsuAudioSignature } from '../audio'
import { BLACK_WHALE_ARENA_CONTRACTS } from './blackWhale'

describe('production treatment for 32 Black Whale Hatsu', () => {
  it('assigns a TourSense visual and a dedicated two-tone sound to every Hatsu', () => {
    const sounds = new Set<string>()
    for (const contract of BLACK_WHALE_ARENA_CONTRACTS) {
      const profile = HATSU_PROFILES.find(({ id }) => id === contract.id)!
      const visual = HATSU_VISUAL_SIGNATURE_BY_KIND[profile.kind]
      expect(visual.manifestation, contract.id).toBeTruthy()
      const sound = arenaHatsuAudioSignature(profile)
      sounds.add(`${sound.base}:${sound.accent}:${sound.duration}:${sound.wave}`)
    }
    expect(sounds.size).toBe(32)
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
    const future = cast(scenario('parallel-future'), 'parallel-future')
    const predator = cast(scenario('rihan-predator'), 'rihan-predator')
    const steal = cast(base, 'steal-chain')
    expect(future.player.position).not.toEqual(base.player.position)
    expect(future.player.mode).toBe('zetsu')
    expect(predator.opponent.empowered).toBe(0)
    expect(steal.opponent.mode).toBe('zetsu')
    expect(steal.opponent.aura).toBeLessThan(base.opponent.aura)
  })

  it('gives the expanded roster distinct attack and defence tools', () => {
    const emperor = cast(scenario('emperor-time'), 'emperor-time')
    const chain = cast(scenario('chain-jail'), 'chain-jail')
    const melody = cast(scenario('melody-enchanting-music'), 'melody-enchanting-music')
    const paper = cast(scenario('dance-of-the-serpents-bite'), 'dance-of-the-serpents-bite')
    const weapon = cast(
      scenario('padaille-weapon-transformation'),
      'padaille-weapon-transformation',
    )
    const snake = cast(scenario('snake-arm'), 'snake-arm')
    const arrow = cast(scenario('grimmel-the-dissonance'), 'grimmel-the-dissonance')

    expect(emperor.player).toMatchObject({ ken: true, gyo: true, empowered: 8 })
    expect(chain.opponent).toMatchObject({ mode: 'zetsu', bound: 3.5 })
    expect(melody.player.ken).toBe(true)
    expect(melody.opponent.cooldown).toBeGreaterThanOrEqual(1.5)
    expect(paper.lastEvent?.technique).toBe('hatsu')
    expect(weapon.lastEvent?.technique).toBe('hatsu')
    expect(snake.opponent.bound).toBe(2.8)
    expect(arrow.lastEvent?.technique).toBe('hatsu')
  })

  it('requires Cross Game to warn before restraining', () => {
    const warning = cast(scenario('cross-game'), 'cross-game')
    const ready = { ...warning, player: { ...warning.player, cooldown: 0 } }
    const restraint = cast(ready, 'cross-game')
    expect(warning.player.hatsuSequence?.id).toBe('cross-game')
    expect(warning.opponent.bound).toBe(0)
    expect(restraint.player.hatsuSequence).toBeNull()
    expect(restraint.opponent.bound).toBe(3)
  })

  it('requires canonical preparation for future sight and Predator', () => {
    const base = scenario('base')
    expect(cast(base, 'parallel-future')).toEqual(base)
    expect(cast(base, 'rihan-predator')).toEqual(base)

    let future: CombatState = { ...base, player: { ...base.player, mode: 'zetsu' } }
    future = combatReducer(future, {
      type: 'PREPARE_HATSU',
      side: 'player',
      hatsuId: 'parallel-future',
    })
    future = { ...future, player: { ...future.player, cooldown: 0 } }
    expect(cast(future, 'parallel-future').player.position).not.toEqual(base.player.position)

    let predator: CombatState = {
      ...base,
      lastHatsuBySide: { player: null, opponent: 'bungee-gum' },
    }
    for (let observation = 0; observation < 3; observation += 1) {
      predator = { ...predator, player: { ...predator.player, cooldown: 0 } }
      predator = combatReducer(predator, {
        type: 'PREPARE_HATSU',
        side: 'player',
        hatsuId: 'rihan-predator',
      })
    }
    predator = { ...predator, player: { ...predator.player, cooldown: 0 } }
    expect(cast(predator, 'rihan-predator')).not.toEqual(predator)
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
  if (id === 'parallel-future')
    return {
      ...state,
      player: {
        ...state.player,
        mode: 'zetsu',
        hatsuPreparation: {
          id,
          observations: 1,
          targetHatsuId: null,
          expiresAt: 2,
        },
      },
    }
  if (id === 'rihan-predator')
    return {
      ...state,
      player: {
        ...state.player,
        hatsuPreparation: {
          id,
          observations: 3,
          targetHatsuId: 'bungee-gum',
          expiresAt: 20,
        },
      },
      lastHatsuBySide: { player: null, opponent: 'bungee-gum' },
    }
  return state
}
