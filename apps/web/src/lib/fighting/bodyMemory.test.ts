import { describe, expect, it } from 'vitest'
import { createFight, nextRound } from './engine'
import { strikeDefender } from './combatDamage'
import { auraFlowRate, nenAttackFactor } from './nen'
import { BODY_MEMORY_ATTACK_FACTOR, BODY_MEMORY_HIT_THRESHOLD } from './bodyMemory'
import type { ArcadeFighter, FightNenZone } from './types'

function hit(fighter: ArcadeFighter, zone: FightNenZone, blocked = false): ArcadeFighter {
  const attacker = createFight('phinks', 'hisoka').player
  return strikeDefender({
    fighter,
    attacker,
    zone,
    damage: 2,
    blocked,
    knockdown: false,
    antiAir: false,
    wallSplat: false,
    counterHit: false,
    comboHits: 1,
  })
}

describe('body memory', () => {
  it('weakens a repeatedly struck limb, but ignores guarded blows and non-limb zones', () => {
    let fighter = createFight('hisoka', 'phinks').player
    fighter = hit(fighter, 'hands', true)
    fighter = hit(fighter, 'torso')
    for (let count = 0; count < BODY_MEMORY_HIT_THRESHOLD; count += 1)
      fighter = hit(fighter, 'hands')

    expect(fighter.bodyMemory?.hits).toEqual({ hands: BODY_MEMORY_HIT_THRESHOLD })
  })

  it('makes focused Ryu costlier and attacks from the weak limb less effective', () => {
    const base = createFight('phinks', 'hisoka').player
    const healthy = nenAttackFactor(base, 'light')
    const weak = {
      ...base,
      bodyMemory: { hits: { hands: BODY_MEMORY_HIT_THRESHOLD } },
      nen: { ...base.nen, mode: 'ren' as const, ryu: { hands: 0.72, torso: 0.12 } },
    }

    expect(auraFlowRate(weak)).toBe(-9)
    expect(nenAttackFactor(weak, 'light')).toBeCloseTo(
      nenAttackFactor({ ...weak, bodyMemory: undefined }, 'light') * BODY_MEMORY_ATTACK_FACTOR,
    )
    expect(healthy).toBeGreaterThan(0)
  })

  it('keeps the weakness between rounds of the same match', () => {
    const state = createFight('hisoka', 'phinks')
    const bodyMemory = { hits: { feet: BODY_MEMORY_HIT_THRESHOLD } }
    const next = nextRound({
      ...state,
      phase: 'finished',
      winner: 'player',
      player: { ...state.player, bodyMemory },
    })

    expect(next.player.bodyMemory).toEqual(bodyMemory)
  })
})
