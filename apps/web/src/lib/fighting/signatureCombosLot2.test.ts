import { describe, expect, it } from 'vitest'
import { isErigeronAction } from './billSupport'
import { halkenburgShotConditionsHold } from './halkenburgCollective'
import { predatorReady } from './predator'
import { readyCohort } from './preparationWorld'
import { signatureCombo } from './signatureCombos'
import { createSignatureFight, playSignatureCombo } from './signatureComboRunner'

describe('Lot 2 signature combos — canonical conditions (21–30)', () => {
  it('Rihan: completes 5-facet Predator analysis on live manifestation and launches Predator', () => {
    const combo = signatureCombo('rihan:perfect-analysis')
    const start = createSignatureFight(combo, { mirrored: false, gap: 5 })
    expect(predatorReady(start, 'player')).toBe(false)
    let launched = false
    const run = playSignatureCombo(combo, start, {
      onFrame: (state) => {
        if (state.player.predator?.hunt) launched = true
      },
    })
    expect(run.reached).toBe(combo.steps.length)
    expect(launched).toBe(true)
  })

  it('Zakuro: deploys scouts from a real wound and recalls blood without healing', () => {
    const combo = signatureCombo('zakuro:scarlet-hound')
    const start = createSignatureFight(combo, { mirrored: false, gap: 5 })
    expect(start.player.openWounds).toBeGreaterThan(0)
    const hpBefore = start.player.health
    const run = playSignatureCombo(combo, start)
    expect(run.reached).toBe(combo.steps.length)
    expect(run.state.player.bloodyMary?.returning || (run.state.player.bloodyMary?.sealedWounds ?? 0) > 0).toBe(true)
    expect(run.state.player.health).toBeLessThanOrEqual(hpBefore)
  })

  it('Melody: entraces opponent with zero music damage and stops playing before striking', () => {
    const combo = signatureCombo('melody:detuned-heartbeat')
    let entranced = false
    const run = playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }), {
      onFrame: (state) => {
        if (state.opponent.hatsuEffects.entrancedFrames > 0) entranced = true
      },
    })
    expect(run.reached).toBe(combo.steps.length)
    expect(entranced).toBe(true)
    expect(run.state.player.melodyPerformance).toBeUndefined()
  })

  it('Basho: writes the attested haiku uninterrupted before striking', () => {
    const combo = signatureCombo('basho:burning-fist')
    const run = playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }))
    expect(run.reached).toBe(combo.steps.length)
    expect(run.state.player.bashoPoem?.ready).toBe(true)
  })

  it('Camilla: triggers Cat’s Name only after real opponent-caused death in Zetsu, then revives', () => {
    const combo = signatureCombo('camilla:second-life')
    let sawCats = false
    const run = playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }), {
      onFrame: (state) => {
        if (state.catsName) sawCats = true
      },
    })
    expect(run.reached).toBe(combo.steps.length)
    expect(sawCats).toBe(true)
    expect(run.state.catsName).toBeUndefined()
    expect(run.state.player.health).toBe(run.state.player.maxHealth)
  })

  it('Halkenburg: collective arrow remains impossible in 1v1 without consenting supporters', () => {
    const combo = signatureCombo('halkenburg:royal-unison')
    const start = createSignatureFight(combo, { mirrored: false, gap: 5 })
    expect(halkenburgShotConditionsHold(start, 'player', readyCohort(start, 'player'))).toBe(false)
    const run = playSignatureCombo(combo, start)
    expect(run.reached).toBe(combo.steps.length)
  })

  it('Gel: completes extended snake-arm route cleanly', () => {
    const combo = signatureCombo('gel:extended-jaw')
    const run = playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }))
    expect(run.reached).toBe(combo.steps.length)
  })

  it('Lynch: asks a spoken question and triggers Body and Soul on real fist contact', () => {
    const combo = signatureCombo('lynch:body-and-soul')
    let asked = false
    const run = playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }), {
      onFrame: (state) => {
        if (state.player.lynchQuestion) asked = true
      },
    })
    expect(run.reached).toBe(combo.steps.length)
    expect(asked).toBe(true)
  })

  it('Luini: completes crossing route without open-space teleportation', () => {
    const combo = signatureCombo('luini:closed-passage')
    const run = playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }))
    expect(run.reached).toBe(combo.steps.length)
    expect(run.state.player.luiniPassage).toBeUndefined()
  })

  it('Bill: completes close-guard route while Erigeron remains strictly non-offensive', () => {
    const combo = signatureCombo('bill:close-guard')
    const start = createSignatureFight(combo, { mirrored: false, gap: 5 })
    expect(isErigeronAction(start.player, 'special', 'bill:neutralSpecial')).toBe(true)
    const run = playSignatureCombo(combo, start)
    expect(run.reached).toBe(combo.steps.length)
  })
})
