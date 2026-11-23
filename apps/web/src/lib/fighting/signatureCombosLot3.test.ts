import { describe, expect, it } from 'vitest'
import { createSignatureFight, playSignatureCombo } from './signatureComboRunner'
import { DUEL_COMBO_FIGHTERS } from './duelComboProfiles'
import { SIGNATURE_COMBOS, signatureCombo, signatureCombosFor } from './signatureCombos'

describe('Lot 3 signature combos & 40/40 roster coverage (31–40)', () => {
  it('covers every single one of the 40 duel roster fighters', () => {
    const missing = DUEL_COMBO_FIGHTERS.filter((id) => signatureCombosFor(id).length === 0)
    expect(missing).toEqual([])
    expect(SIGNATURE_COMBOS.length).toBeGreaterThanOrEqual(41)
  })

  it('Musse: marks the opponent with Secret Window during preparation before firing the pistol', () => {
    const combo = signatureCombo('musse:secret-window')
    const prepared = createSignatureFight(combo, { mirrored: false, gap: 5 })
    expect(prepared.player.secretWindow?.target).toBe('opponent')
    const run = playSignatureCombo(combo, prepared)
    expect(run.reached).toBe(combo.steps.length)
  })

  it('Padaille: conjures the right-hand drill for 20 aura and cancels into the sweep', () => {
    const combo = signatureCombo('padaille:cutting-tool')
    const start = createSignatureFight(combo, { mirrored: false, gap: 5 })
    const run = playSignatureCombo(combo, start)
    expect(run.reached).toBe(combo.steps.length)
    expect(run.contacts.some((hit) => hit.move === 'padaille:forwardSpecial')).toBe(true)
  })

  it('Terebellum: lands the physical Sweet Home carrier cleanly into throw capture', () => {
    const combo = signatureCombo('terebellum:injury-transfer')
    const run = playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }))
    expect(run.reached).toBe(combo.steps.length)
    expect(run.contacts.some((hit) => hit.move === 'terebellum:neutralSpecial')).toBe(true)
  })

  it.each([
    'furykov:guard-reading',
    'cluck:messenger-flight',
    'beyond:ren-pressure',
    'longhi:moonlight-guard',
    'sayird:little-eye',
    'voconte:service-door',
    'yokotani:right-of-withdrawal',
  ])('%s completes cleanly through real commands', (id) => {
    const combo = signatureCombo(id)
    const run = playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }))
    expect(run.reached).toBe(combo.steps.length)
    expect(run.contacts.some((hit) => hit.blocked)).toBe(false)
  })
})
