import { describe, expect, it } from 'vitest'
import { signatureCombo } from './signatureCombos'
import { createSignatureFight, playSignatureCombo } from './signatureComboRunner'
import { sealedSenseCount, senseDeprived } from './saiyuSenses'
import { halfPriceCost, recordComboTechnique } from './comboHalfPrice'
import { confirmShot } from './shotConfirm'
import { movesetFor } from './movesets'
import type { FightState } from './types'

const play = (id: string) => {
  const combo = signatureCombo(id)
  return playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }))
}

describe('Les trois interdits', () => {
  it('lands each monkey on its own, seals three senses and forces no Zetsu', () => {
    const { state, contacts } = play('saiyu:three-forbidden')
    const monkeys = ['saiyu:neutralSpecial', 'saiyu:forwardSpecial', 'saiyu:downSpecial']
    for (const monkey of monkeys)
      expect(contacts.filter((hit) => hit.move === monkey)).toHaveLength(1)
    expect(sealedSenseCount(state.opponent)).toBe(3)
    for (const sense of ['sight', 'hearing', 'speech'] as const)
      expect(senseDeprived(state.opponent, sense)).toBe(true)
    expect(state.opponent.nen.mode).not.toBe('zetsu')
  })
})

describe('Leçon de tir', () => {
  it('keeps Theta to her real handgun and close combat', () => {
    expect(movesetFor('theta')!.moves.some((move) => move.slot === 'finisher')).toBe(false)
    const { contacts } = play('theta:shooting-lesson')
    expect(contacts.map((hit) => hit.move)).toContain('theta:forwardSpecial')
  })
})

function held(state: FightState): FightState {
  return { ...state, opponent: { ...state.opponent, comboHits: 3, comboDamage: 20, hitStun: 10 } }
}

describe('later techniques cost a third for Saiyu and Franklin', () => {
  const start = held(
    createSignatureFight(signatureCombo('saiyu:three-forbidden'), { mirrored: false, gap: 5 }),
  )
  const mizaru = { auraCost: 40 }

  it('charges the first technique in full, then a third while the target stays held', () => {
    expect(halfPriceCost(start, 'player', mizaru)).toBeUndefined()
    const after = { ...start, player: recordComboTechnique(start, 'player', mizaru) }
    expect(halfPriceCost(after, 'player', { auraCost: 55 })).toBe(19)
    const released = { ...after, opponent: { ...after.opponent, comboHits: 0, hitStun: 0 } }
    expect(halfPriceCost(released, 'player', { auraCost: 55 })).toBeUndefined()
  })

  it('leaves everyone else at full price', () => {
    const hisoka = { ...start, player: { ...start.player, id: 'hisoka' as const } }
    const after = { ...hisoka, player: recordComboTechnique(hisoka, 'player', mizaru) }
    expect(halfPriceCost(after, 'player', { auraCost: 55 })).toBeUndefined()
  })
})

describe('a landed bullet confirms its shot', () => {
  const state = createSignatureFight(signatureCombo('theta:shooting-lesson'), {
    mirrored: false,
    gap: 5,
  })
  const shooting = {
    ...state.player,
    attack: {
      moveId: 'theta:backSpecial',
      kind: 'ranged' as const,
      frame: 14,
      impacted: false,
      confirmedHit: false,
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
      projectileSpawned: true,
      reversal: false,
    },
  }
  it('confirms on a hit, never on a block or a dodge', () => {
    const hit = { blocked: false, avoided: false }
    expect(confirmShot(shooting, { fighterId: 'theta' }, hit).attack?.confirmedHit).toBe(true)
    expect(
      confirmShot(shooting, { fighterId: 'theta' }, { ...hit, blocked: true }).attack?.confirmedHit,
    ).toBe(false)
    expect(
      confirmShot(shooting, { fighterId: 'theta' }, { ...hit, avoided: true }).attack?.confirmedHit,
    ).toBe(false)
  })
})
