import { describe, expect, it } from 'vitest'
import { tickFight } from './engine'
import { blinkyMoveAllowed } from './blinkyMoveset'
import { hasPlantedPaper } from './kallutoPaper'
import { signatureCombo } from './signatureCombos'
import { createSignatureFight, playSignatureCombo } from './signatureComboRunner'
import { EMPTY_INPUT } from './types'

describe('Lot 1A signature combos — canonical conditions (13–16)', () => {
  it('Illumi: implants the special skull needle and switches its order to approach', () => {
    const combo = signatureCombo('illumi:implanted-order')
    const run = playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }))
    expect(run.reached).toBe(combo.steps.length)
    expect(run.state.opponent.needlePuppet?.needleEmbedded).toBe(true)
    expect(run.state.opponent.needlePuppet?.order).toBe('approach')
  })

  it('Illumi: without needles, cannot implant control or complete the route', () => {
    const combo = signatureCombo('illumi:implanted-order')
    const start = createSignatureFight(combo, { mirrored: false, gap: 5 })
    const disarmed = {
      ...start,
      player: { ...start.player, weaponsConfiscated: true, equipmentProps: undefined },
    }
    const run = playSignatureCombo(combo, disarmed)
    expect(run.state.opponent.needlePuppet).toBeUndefined()
    expect(run.reached).toBeLessThan(combo.steps.length)
  })

  it('Kalluto: requires an embedded paper fragment before serpent convergence', () => {
    const combo = signatureCombo('kalluto:paper-serpent')
    const prepared = createSignatureFight(combo, { mirrored: false, gap: 5 })
    expect(hasPlantedPaper(prepared, 'player', 'torso')).toBe(true)

    const unpreparedCombo = { ...combo, preparation: undefined }
    const unprepared = createSignatureFight(unpreparedCombo, { mirrored: false, gap: 5 })
    expect(hasPlantedPaper(unprepared, 'player', 'torso')).toBe(false)
    const run = playSignatureCombo(unpreparedCombo, unprepared)
    expect(run.reached).toBeLessThan(unpreparedCombo.steps.length)
  })

  it('Bonolenov: runs uninterrupted Prologue and Jupiter dances, launching the real orb', () => {
    const combo = signatureCombo('bonolenov:celestial-cantabile')
    const prepared = createSignatureFight(combo, { mirrored: false, gap: 5 })
    expect(prepared.player.battleCantabile?.prologue).toBe(true)
    const run = playSignatureCombo(combo, prepared)
    expect(run.reached).toBe(combo.steps.length)
    expect(run.state.projectiles.some((shot) => shot.owner === 'player' && shot.jupiter)).toBe(true)

    const withoutPrologue = { ...combo, preparation: undefined }
    const fail = playSignatureCombo(
      withoutPrologue,
      createSignatureFight(withoutPrologue, { mirrored: false, gap: 5 }),
    )
    expect(fail.reached).toBeLessThan(withoutPrologue.steps.length)
  })

  it('Shizuku: opens a real wound before drawing blood, and refuses blood suction without wounds', () => {
    const combo = signatureCombo('shizuku:clinical-cleanup')
    const start = createSignatureFight(combo, { mirrored: false, gap: 5 })
    expect(blinkyMoveAllowed(start, 'player', 'shizuku:finisher')).toBe(false)

    const run = playSignatureCombo(combo, start)
    expect(run.reached).toBe(combo.steps.length)
    const hpAfterStart = run.state.opponent.health
    let state = run.state
    for (let i = 0; i < 60; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    expect(state.player.blinky?.lastWasBlood).toBe(true)
    expect(state.opponent.health).toBeLessThan(hpAfterStart)
  })
})
