import { describe, expect, it } from 'vitest'
import { signatureCombo, type SignatureCombo } from './signatureCombos'
import { createSignatureFight, playSignatureCombo, playSignatureSteps } from './signatureComboRunner'
import { BISCUIT_TRUE_FORM_REACH } from './biscuitForm'
import { attackData } from './frameData'
import { performMove, tickFight } from './engine'
import { PHINKS_LOW_DODGE } from './phinksLowDodge'
import { EMPTY_INPUT, type FightState } from './types'

const start = (combo: SignatureCombo) => createSignatureFight(combo, { mirrored: false, gap: 5 })
const tick = (state: FightState, input = EMPTY_INPUT) =>
  tickFight(state, input, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })

describe('Retour à la vraie forme', () => {
  const combo = signatureCombo('biscuit:true-form-return')

  it('reveals True Form during the capture and keeps it for the round', () => {
    const run = playSignatureCombo(combo, start(combo))
    expect(run.contacts.map((hit) => hit.combo)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(run.state.player.biscuitTrueForm).toBe(true)
    let state = run.state
    for (let i = 0; i < 240; i++) state = tick(state)
    expect(state.player.biscuitTrueForm).toBe(true)
  })

  it('pays 28 + 20 + 40 aura: Full Impact costs 40 when it closes the held combo', () => {
    const before = start(combo)
    const run = playSignatureCombo(combo, before)
    // Regeneration during the combo only adds aura: the payment never exceeds 88.
    expect(before.player.aura - run.state.player.aura).toBeLessThanOrEqual(88)
    expect(before.player.aura - run.state.player.aura).toBeGreaterThan(70)
  })

  it('reaches farther in True Form', () => {
    const natural = performMove({ state: start(combo), side: 'player', action: 'light' })
    const revealed = {
      ...natural,
      player: { ...natural.player, biscuitTrueForm: true },
    }
    const reach = (state: FightState) => attackData('light', state.player).box.right
    expect(reach(revealed)).toBeCloseTo(reach(natural) * BISCUIT_TRUE_FORM_REACH)
  })
})

describe('Dix tours, un poing', () => {
  const combo = signatureCombo('phinks:ten-turns-one-fist')
  const opening = combo.steps.slice(0, 5)

  it('keeps winding through the back dash, the low dodge and the cross-up jump', () => {
    const run = playSignatureSteps({ steps: opening, hits: 0 }, start(combo))
    const { player, opponent } = run.state
    expect(player.cyclotronWindup).toBeDefined()
    expect(player.hatsuEffects.cyclotronTurns).toBeGreaterThan(0)
    // Landed behind the target: Phinks now faces back toward where he came from.
    expect(Math.sign(opponent.x - player.x)).toBe(player.facing)
    expect(player.x).toBeGreaterThan(opponent.x)
  })

  it('gives the blows in between no bonus; only the release consumes the turns', () => {
    const run = playSignatureCombo(combo, start(combo))
    expect(run.contacts.map((hit) => hit.move)).toEqual([
      'phinks:standingLight',
      'phinks:standingHeavy',
      'phinks:finisher',
    ])
    expect(run.state.player.hatsuEffects.cyclotronTurns).toBe(0)
    const plain = createSignatureFight(combo, { mirrored: false, gap: 3 })
    const jab = (state: FightState) => {
      let next = performMove({ state, side: 'player', action: 'light' })
      for (let i = 0; i < 20; i++) next = tick(next)
      return state.opponent.health - next.opponent.health
    }
    const winding = { ...plain, player: { ...plain.player, cyclotronWindup: { frame: 0 } } }
    const charged = {
      ...winding,
      player: {
        ...winding.player,
        hatsuEffects: { ...winding.player.hatsuEffects, cyclotronTurns: 5 },
      },
    }
    expect(jab(charged)).toBe(jab(plain))
  })

  it('stops winding under guard', () => {
    const winding = playSignatureSteps({ steps: opening.slice(0, 1), hits: 0 }, start(combo)).state
    const back = winding.player.facing === 1 ? { left: true } : { right: true }
    let state = winding
    for (let i = 0; i < 4; i++) state = tick(state, { ...EMPTY_INPUT, guard: true, ...back })
    expect(state.player.cyclotronWindup).toBeUndefined()
  })

  it('advances about six units with the low dodge', () => {
    const { frames, peak } = PHINKS_LOW_DODGE
    const distance = (peak * (frames + 1)) / 2 / 60
    expect(distance).toBeGreaterThan(5)
    expect(distance).toBeLessThan(8)
  })
})
