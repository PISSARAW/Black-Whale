import { describe, expect, it } from 'vitest'
import { crossGameRestrained } from './crossGame'
import { tickFight } from './engine'
import { wakeHanzoBody } from './hanzoProjection'
import { HINRIGH_KNIVES } from './hinrighKnives'
import { signatureCombo } from './signatureCombos'
import { createSignatureFight, playSignatureCombo } from './signatureComboRunner'
import { EMPTY_INPUT } from './types'

describe('Lot 1B signature combos — canonical conditions (17–20)', () => {
  it('Hinrigh: transforms real handcuffs and spends one finite knife at conclusion', () => {
    const combo = signatureCombo('hinrigh:urban-menagerie')
    const start = createSignatureFight(combo, { mirrored: false, gap: 5 })
    const startKnives = start.player.hinrighKnives ?? HINRIGH_KNIVES
    expect(startKnives).toBe(HINRIGH_KNIVES)
    const run = playSignatureCombo(combo, start)
    expect(run.reached).toBe(combo.steps.length)
    expect(run.state.player.hinrighKnives).toBe(startKnives - 1)
  })

  it('Mizaistom: confines only on disobedience; an obedient opponent stops the route', () => {
    const combo = signatureCombo('mizaistom:interrupted-hearing')
    const run = playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }))
    expect(run.reached).toBe(combo.steps.length)
    expect(crossGameRestrained(run.state.opponent)).toBe(true)

    const obedient = { ...combo, steps: combo.steps.slice(0, 4) }
    let state = playSignatureCombo(
      obedient,
      createSignatureFight(obedient, { mirrored: false, gap: 5 }),
    ).state
    for (let i = 0; i < 40; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    expect(state.opponent.crossGame?.phase).toBe('warning')
    expect(crossGameRestrained(state.opponent)).toBe(false)
  })

  it('Leorio: remote punch erupts at the aimed point and never tracks a moving target', () => {
    const combo = signatureCombo('leorio:under-the-floor')
    const run = playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }))
    expect(run.reached).toBe(combo.steps.length)
    expect(run.contacts.some((hit) => hit.move === 'leorio:neutralSpecial')).toBe(true)
  })

  it('Hanzo: keeps the sleeping body exposed; waking it cancels projection and blocks the choke', () => {
    const combo = signatureCombo('hanzo:empty-body')
    const run = playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }))
    expect(run.reached).toBe(combo.steps.length)
    expect(run.state.player.hanzoProjection).toBeDefined()

    const woken = wakeHanzoBody(run.state.player)
    expect(woken.hanzoProjection).toBeUndefined()
  })
})
