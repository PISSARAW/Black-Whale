import { describe, expect, it } from 'vitest'
import { createFightState } from '../fightState'
import { FURYKOV_TIER_1 } from '../furykovProfile'
import { resolveOpponentHudView, resolvePerceptionLevel } from './opponentHudView'

describe('opponentHudView', () => {
  it('starts opaque at level 0 in tactical mode', () => {
    const state = createFightState('kurapika', 'hisoka')
    const max = state.opponent.maxHealth ?? 100
    state.opponent.health = Math.round(max * 0.72)
    state.opponent.aura = 80

    const view = resolveOpponentHudView({ state, observerSide: 'player', mode: 'tactical' })
    expect(view.level).toBe(0)
    expect(view.health.exact).toBeNull()
    expect(view.health.tier).toBeNull()
    expect(view.health.portraitMood).toBe('calm')
    expect(view.aura.exact).toBeNull()
    expect(view.aura.bracket).toBeNull()
    expect(view.aura.ryuVisible).toBe(false)
    expect(view.burst.exactAvailable).toBeNull()
    expect(view.burst.knownSpent).toBe(false)
    expect(view.kameo.visible).toBe(false)
  })

  it('unlocks level 1 deductions from combat intel without leaking exact numbers', () => {
    const state = createFightState('kurapika', 'hisoka')
    const max = state.opponent.maxHealth ?? 100
    state.opponent.health = Math.round(max * 0.45)
    state.opponent.aura = 50
    state.opponentIntel!.player = {
      cleanHitsLanded: 2,
      lastImpactSequence: 2,
      auraObserved: true,
      burstUsedSeen: true,
      kameoRevealed: true,
      revealedConditions: ['painPacker'],
    }

    const view = resolveOpponentHudView({ state, observerSide: 'player', mode: 'tactical' })
    expect(view.level).toBe(1)
    expect(view.health.exact).toBeNull()
    expect(view.health.tier).toBe('wounded')
    expect(view.health.portraitMood).toBe('strained')
    expect(view.aura.exact).toBeNull()
    expect(view.aura.bracket).toBe('medium')
    expect(view.burst.knownSpent).toBe(true)
    expect(view.kameo).toEqual({ visible: true, showCooldown: false, showRole: false })
  })

  it('elevates to level 2 with full ocular Gyo, Sonar, or Furykov analysis', () => {
    const state = createFightState('kurapika', 'hisoka')
    const max = state.opponent.maxHealth ?? 100
    state.opponent.aura = 64
    state.opponent.health = Math.round(max * 0.22)
    state.player.nen.gyo = true

    const gyoView = resolveOpponentHudView({ state, observerSide: 'player', mode: 'tactical' })
    expect(gyoView.level).toBe(2)
    expect(gyoView.aura.exact).toBe(64)
    expect(gyoView.aura.ryuVisible).toBe(true)
    expect(gyoView.health.adrenalineAlert).toBe(true)

    const furykovState = createFightState('furykov', 'hisoka')
    furykovState.player.furykovGauge = FURYKOV_TIER_1
    expect(resolvePerceptionLevel({ state: furykovState, observerSide: 'player' })).toBe(2)
  })

  it('locks Hisoka living portrait mood to calm while Texture Surprise masks wounds', () => {
    const state = createFightState('kurapika', 'hisoka')
    state.opponent.health = 10
    state.opponent.textureSurprise = {
      surface: 'cloth',
      displayedHp: 90,
      maskedLimbs: [],
      bungeeTrapLimb: null,
      integrity: 1,
    }

    const view = resolveOpponentHudView({ state, observerSide: 'player', mode: 'tactical' })
    expect(view.health.textureMasked).toBe(true)
    expect(view.health.portraitMood).toBe('calm')
    expect(view.health.adrenalineAlert).toBe(false)
  })

  it('exposes exact values in omniscient mode (training / replay)', () => {
    const state = createFightState('kurapika', 'hisoka', { mode: 'training' })
    state.opponent.health = 63
    state.opponent.aura = 42

    const view = resolveOpponentHudView({ state, observerSide: 'player', mode: 'omniscient' })
    expect(view.health.exact).toBe(63)
    expect(view.aura.exact).toBe(42)
    expect(view.burst.exactAvailable).toBe(true)
    expect(view.kameo).toEqual({ visible: true, showCooldown: true, showRole: true })
  })
})
