import { describe, expect, it } from 'vitest'
import { createSignatureFight, playSignatureCombo } from './signatureComboRunner'
import { DUEL_COMBO_FIGHTERS } from './duelComboProfiles'
import { moveById, movesetFor } from './movesets'
import {
  SIGNATURE_COMBOS,
  signatureCombo,
  signatureCombosFor,
  signatureHits,
} from './signatureCombos'
import { isSignatureLesson } from './signatureSchool'
import { ALTERNATE_SIGNATURE_CHOREOGRAPHY } from './alternateSignatureChoreography'
import { ALTERNATE_SIGNATURE_MOVES } from './alternateSignatureMoves'

describe('Lot 3 signature combos & 40/40 roster coverage (31–40)', () => {
  it('gives all 40 fighters a distinct sequence of three new attacks and an Academy lesson', () => {
    const attacks = new Set<string>()
    const choreographies = new Set<string>()
    for (const id of DUEL_COMBO_FIGHTERS) {
      const combos = signatureCombosFor(id)
      expect(combos.length, id).toBeGreaterThanOrEqual(2)
      const alternate = signatureCombo(`${id}:alternate-signature`)
      expect(isSignatureLesson(alternate.id)).toBe(true)
      expect(alternate.steps).toHaveLength(3)
      expect(
        alternate.steps.every((step) => 'signatureAttack' in step),
        id,
      ).toBe(true)
      const ids = signatureHits(alternate)
      const moveset = movesetFor(id)!
      expect(moveset.signatureOpening?.id).toBe(ids[0])
      expect(moveset.combos).toContainEqual(ids)
      for (const attackId of ids) {
        const attack = moveById(attackId)!
        expect(attack.id).toBe(attackId)
        expect(
          moveset.moves.some((move) => move.nameFr === attack.nameFr),
          id,
        ).toBe(false)
        expect(
          moveset.moves.some((move) => move.nameEn === attack.nameEn),
          id,
        ).toBe(false)
        attacks.add(attackId)
      }
      const [opening, transition] = ALTERNATE_SIGNATURE_CHOREOGRAPHY[id]!
      choreographies.add(`${opening[0]}:${transition[0]}:${ALTERNATE_SIGNATURE_MOVES[id]!.base}`)
    }
    expect(attacks.size).toBe(120)
    expect(choreographies.size).toBe(40)
  })

  it('keeps every signature route within ten movements', () => {
    expect(SIGNATURE_COMBOS.filter((combo) => combo.steps.length > 10)).toEqual([])
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
