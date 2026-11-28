import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { nenTransferFrames } from './nenTransfer'
import { rememberBodyHit } from './bodyMemory'
import { applyGelVenom, GEL_VENOM_TRANSFER_PENALTY } from './zodiacAndHeirUpgrades'
import { applyJupiterAcousticImpact, JUPITER_TRANSFER_PENALTY } from './halkenburgBonolenovUpgrades'
import { readNenSensoryHud } from './nenSensoryHud'
import type { ArcadeFighter } from './types'

describe('Deterministic 4-layer transfer pipeline & zero-text Sensory HUD', () => {
  it('1. 4-layer nenTransferFrames: 1f reflex transcends normal fatigue but still suffers Gel venom & Jupiter stun', () => {
    const base = beginFight(createFight('hisoka', 'gel', { mode: 'versus-local' })).player
    const enReflex = { ...base, enReflexActive: true, nenMentalFatigue: 5000 }
    // 50% mental fatigue is transcended by 1f En reflex
    expect(nenTransferFrames(enReflex)).toBe(1)

    // Critical cognitive overload (>= 85%) slows even a 1f reflex
    const overloadedReflex = { ...enReflex, nenMentalFatigue: 9000 }
    expect(nenTransferFrames(overloadedReflex)).toBe(2)

    // Gel venom (+2f) and Jupiter acoustic stun (+2f) are never erased by 1f early return
    const poisonedReflex = applyGelVenom(enReflex)
    expect(nenTransferFrames(poisonedReflex)).toBe(1 + GEL_VENOM_TRANSFER_PENALTY)

    const stunnedAndPoisoned = applyJupiterAcousticImpact(poisonedReflex, false)
    expect(nenTransferFrames(stunnedAndPoisoned)).toBe(
      1 + GEL_VENOM_TRANSFER_PENALTY + JUPITER_TRANSFER_PENALTY,
    )
  })

  it('2. readNenSensoryHud keeps canon cues without invented Gel venom or Beyond saturation', () => {
    let state = beginFight(createFight('hanzo', 'beyond', { mode: 'versus-local' }))
    let hanzo: ArcadeFighter = {
      ...state.player,
      hanzoProjection: {
        bodyX: 20,
        bodyFacing: 1 as const,
        bodyNen: state.player.nen,
        startupFrames: 0,
      },
      nenMentalFatigue: 6000,
      fearCooldownFrames: 60,
    }
    for (let i = 0; i < 3; i++)
      hanzo = rememberBodyHit(hanzo, { zone: 'hands', damage: 10, blocked: false })
    hanzo = rememberBodyHit(hanzo, { zone: 'feet', damage: 10, blocked: false })

    const beyondRen = {
      ...state.opponent,
      nen: { ...state.opponent.nen, mode: 'ren' as const },
    }
    state = { ...state, player: hanzo, opponent: beyondRen }

    const selfHud = readNenSensoryHud(state, 'player', 'player')
    expect(selfHud.detachedAuraRatio).toBeGreaterThan(0)
    expect(selfHud.bodyAuraOpacity).toBeLessThan(1)
    expect(selfHud.portraitStressLevel).toBeGreaterThanOrEqual(0.6)
    expect(selfHud.heartbeatPulse).toBeGreaterThanOrEqual(0.75)
    expect(selfHud.limbRingTint).toEqual({ hands: 'crimson', feet: 'amber' })

    const poisonedHud = readNenSensoryHud(
      { ...state, player: applyGelVenom(state.player) },
      'player',
      'player',
    )
    expect(poisonedHud.limbRingTint.hands).toBe('crimson')

    // Beyond has no revealed Gyo-saturation property.
    const viewingBeyond = readNenSensoryHud(state, 'opponent', 'player')
    expect(viewingBeyond.auraBarJitter).toBe(0)
  })

  it('3. readNenSensoryHud does not give Theta an invented stress-hiding passive', () => {
    const state = beginFight(createFight('theta', 'hisoka', { mode: 'versus-local' }))
    const lowTheta = { ...state, player: { ...state.player, health: 10, nenMentalFatigue: 5000 } }
    expect(readNenSensoryHud(lowTheta, 'player', 'player').portraitStressLevel).toBeGreaterThan(0.5)
    expect(readNenSensoryHud(lowTheta, 'player', 'opponent').portraitStressLevel).toBeGreaterThan(
      0.5,
    )
  })
})
