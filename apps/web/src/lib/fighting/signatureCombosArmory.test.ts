import { describe, expect, it } from 'vitest'
import { signatureCombo } from './signatureCombos'
import { createSignatureFight, playSignatureCombo } from './signatureComboRunner'
import { advanceMachiThreads } from './machiThread'
import { pinnedKnockback, pinnedKnockdown } from './groundedPin'
import { tickFight } from './engine'
import { EMPTY_INPUT, type FightState } from './types'

const play = (id: string) => {
  const combo = signatureCombo(id)
  return playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }))
}

describe('Feu de suppression', () => {
  it('lands every bullet of every volley in one combo', () => {
    const { contacts } = play('franklin:suppressive-fire')
    expect(contacts).toHaveLength(103)
    expect(contacts.every((hit, index) => hit.combo === index + 1 && !hit.blocked)).toBe(true)
  })

  it('keeps Franklin interruptible: a hit stops his volley', () => {
    const combo = signatureCombo('franklin:suppressive-fire')
    let state: FightState = playSignatureCombo(
      { ...combo, steps: combo.steps.slice(0, 7) },
      createSignatureFight(combo, { mirrored: false, gap: 5 }),
    ).state
    state = { ...state, player: { ...state.player, hitStun: 20, attack: state.player.attack } }
    const fired = state.player.attack?.projectilesSpawned ?? 0
    for (let i = 0; i < 6; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    expect(state.player.attack?.projectilesSpawned ?? 0).toBe(fired)
  })

  it('extends a grounded hold by the full volley for a confirmed shot', () => {
    const { state } = play('franklin:suppressive-fire')
    const lying = { ...state.opponent, knockdownFrames: 5 }
    const held = { ...state.player, attack: { ...state.player.attack!, accel: true as const } }
    const native = { ...held, attack: { ...held.attack, accel: undefined } }
    expect(pinnedKnockback({ fighter: lying, attacker: held }, 3)).toBe(0)
    expect(pinnedKnockdown({ fighter: lying, attacker: held, blocked: false }, 12)).toBeGreaterThan(
      12,
    )
    expect(pinnedKnockdown({ fighter: lying, attacker: native, blocked: false }, 12)).toBe(5)
    expect(
      pinnedKnockdown({ fighter: lying, attacker: held, melee: true, blocked: false }, 12),
    ).toBe(12)
  })
})

describe('Fil court', () => {
  it('opens the wound, binds, rebinds with the Troupe Bind and ends on the final tension', () => {
    const { state, contacts } = play('machi:short-thread')
    expect(contacts.map((hit) => hit.move)).toContain('machi:finisher')
    expect(state.opponent.openWounds ?? 0).toBeGreaterThanOrEqual(1)
  })

  it('drops the bind when Machi lets go of the thread or goes beyond its reach', () => {
    const combo = signatureCombo('machi:short-thread')
    const bound = playSignatureCombo(
      { ...combo, steps: combo.steps.slice(0, 4) },
      createSignatureFight(combo, { mirrored: false, gap: 5 }),
    ).state
    expect(bound.opponent.machiThread?.kind).toBe('bind')
    const striking = {
      ...bound,
      player: {
        ...bound.player,
        attack: { ...bound.player.attack!, moveId: 'machi:standingLight' },
      },
    }
    expect(advanceMachiThreads(striking).opponent.machiThread?.kind).toBe('mark')
    const far = { ...bound, player: { ...bound.player, attack: null, x: bound.opponent.x - 40 } }
    expect(advanceMachiThreads(far).opponent.machiThread?.kind).toBe('mark')
  })
})
