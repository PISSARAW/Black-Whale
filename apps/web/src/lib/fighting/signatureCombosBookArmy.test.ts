import { describe, expect, it } from 'vitest'
import { signatureCombo, type SignatureCombo } from './signatureCombos'
import { createSignatureFight, playSignatureCombo } from './signatureComboRunner'
import { GROUNDED_PIN_KNOCKBACK, pinnedKnockback } from './groundedPin'
import type { ArcadeFighter } from './types'

const play = (combo: SignatureCombo) =>
  playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }))
const without = (combo: SignatureCombo, index: number): SignatureCombo => ({
  ...combo,
  preparation: combo.preparation?.filter((_, i) => i !== index),
})

describe('Double page', () => {
  const combo = signatureCombo('chrollo:double-page')

  it('prepares Sun and the bookmark before the combo, never during it', () => {
    const start = createSignatureFight(combo, { mirrored: false, gap: 5 })
    expect(start.opponent.hatsuEffects.sunMark).toBe(1)
    expect(start.player.chrolloBook).toMatchObject({ open: false, bookmark: 'sun-and-moon' })
    expect(start.opponent.comboHits).toBe(0)
  })

  it('stamps Moon from the bookmarked page and detonates both marks', () => {
    const start = createSignatureFight(combo, { mirrored: false, gap: 5 })
    const pages = start.player.chrolloBook?.pages
    const run = playSignatureCombo(combo, start)
    expect(run.contacts.at(-1)).toMatchObject({ move: 'chrollo:finisher', combo: 6 })
    expect(run.state.opponent.hatsuEffects).toMatchObject({ sunMark: 0, moonMark: 0 })
    // No Hatsu is stolen: the prepared book remains unchanged throughout the combo.
    expect(run.state.player.chrolloBook?.pages).toEqual(pages)
    expect(pages).toEqual(expect.arrayContaining(['sun-and-moon', 'black-voice']))
  })

  it('does not detonate without the prepared Sun', () => {
    const run = play(without(combo, 0))
    expect(run.state.opponent.hatsuEffects.moonMark + run.state.opponent.hatsuEffects.sunMark).toBe(
      1,
    )
  })
})

describe('Commandement absolu', () => {
  const combo = signatureCombo('benjamin:absolute-command')

  it('plays the card captured in preparation, never a bullet of its own burst', () => {
    const start = createSignatureFight(combo, { mirrored: false, gap: 5 })
    expect(start.player.hatsuEffects.baton?.card?.fighterId).toBe('franklin')
    const run = play(combo)
    expect(run.contacts.map((hit) => hit.move).slice(5, 8)).toEqual(
      Array(3).fill('benjamin:ranged'),
    )
    expect(run.state.player.hatsuEffects.baton?.card).toBeNull()
  })

  it('cannot play a card that was never captured', () => {
    const run = play(without(combo, 2))
    expect(run.reached).toBeLessThan(combo.steps.length)
  })

  it('takes information from Secret Window, not damage', () => {
    const marked = play(combo)
    const unmarked = play(without(combo, 0))
    expect(unmarked.reached).toBe(combo.steps.length)
    expect(marked.state.opponent.health).toBe(unmarked.state.opponent.health)
  })
})

describe('grounded pin', () => {
  it('limits only the push of a combo route on a body lying on the ground', () => {
    const down = { knockdownFrames: 4 } as ArcadeFighter
    const route = { attack: { accel: true } } as ArcadeFighter
    const native = { attack: {} } as ArcadeFighter
    expect(pinnedKnockback({ fighter: { ...down, knockdownFrames: 0 }, attacker: route, melee: true }, 6.8)).toBe(6.8)
    expect(pinnedKnockback({ fighter: down, attacker: native, melee: true }, 6.8)).toBe(6.8)
    expect(pinnedKnockback({ fighter: down, attacker: route, melee: true }, 6.8)).toBe(GROUNDED_PIN_KNOCKBACK)
  })
})
