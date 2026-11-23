import { describe, expect, it } from 'vitest'
import { createFightState, nextFightRound } from '../fightState'
import { SENSE_BITS } from '../saiyuSenses'
import { advanceOpponentIntel, carryOpponentIntel } from './opponentIntel'

describe('opponentIntel', () => {
  it('starts empty on a fresh fight state', () => {
    const state = createFightState('kurapika', 'hisoka')
    expect(state.opponentIntel?.player).toEqual({
      cleanHitsLanded: 0,
      lastImpactSequence: 0,
      auraObserved: false,
      burstUsedSeen: false,
      kameoRevealed: false,
      revealedConditions: [],
    })
  })

  it('records clean hits, visible active Nen, Burst usage, and Kameo entry', () => {
    const base = createFightState('kurapika', 'hisoka')
    base.phase = 'fighting'
    base.impact = {
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
    }
    base.opponent.nen.mode = 'ren'
    base.burst = { side: 'opponent', frame: 10, sequence: 1 }

    const updated = advanceOpponentIntel(base)
    expect(updated.opponentIntel?.player.cleanHitsLanded).toBe(1)
    expect(updated.opponentIntel?.player.auraObserved).toBe(true)
    expect(updated.opponentIntel?.player.burstUsedSeen).toBe(true)

    // Stepping again with the same impact sequence does not double-count clean hits
    const same = advanceOpponentIntel(updated)
    expect(same.opponentIntel?.player.cleanHitsLanded).toBe(1)
    expect(same).toBe(updated)
  })

  it('does not leak hidden aura under In or observe visuals while blinded by Mizaru', () => {
    const state = createFightState('kurapika', 'hisoka')
    state.phase = 'fighting'
    state.opponent.nen.mode = 'ren'
    state.opponent.nen.in = true
    const afterIn = advanceOpponentIntel(state)
    expect(afterIn.opponentIntel?.player.auraObserved).toBe(false)

    afterIn.opponent.nen.in = false
    afterIn.player.hatsuEffects.senseSeals = SENSE_BITS.sight
    afterIn.burst = { side: 'opponent', frame: 5, sequence: 1 }
    const afterBlind = advanceOpponentIntel(afterIn)
    expect(afterBlind.opponentIntel?.player.auraObserved).toBe(false)
    expect(afterBlind.opponentIntel?.player.burstUsedSeen).toBe(false)
  })

  it('carries structural intel across rounds while resetting round-local counters', () => {
    const state = createFightState('kurapika', 'hisoka')
    state.opponentIntel = {
      player: {
        cleanHitsLanded: 4,
        lastImpactSequence: 9,
        auraObserved: true,
        burstUsedSeen: true,
        kameoRevealed: true,
        revealedConditions: ['cyclotron'],
      },
      opponent: {
        cleanHitsLanded: 2,
        lastImpactSequence: 3,
        auraObserved: false,
        burstUsedSeen: false,
        kameoRevealed: false,
        revealedConditions: [],
      },
    }
    const carried = carryOpponentIntel(state.opponentIntel)
    expect(carried.player).toEqual({
      cleanHitsLanded: 0,
      lastImpactSequence: 0,
      auraObserved: true,
      burstUsedSeen: false,
      kameoRevealed: true,
      revealedConditions: ['cyclotron'],
    })

    state.phase = 'finished'
    state.winner = 'player'
    const round2 = nextFightRound(state)
    expect(round2.opponentIntel?.player.kameoRevealed).toBe(true)
    expect(round2.opponentIntel?.player.burstUsedSeen).toBe(false)
  })
})
