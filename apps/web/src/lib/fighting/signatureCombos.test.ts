import { describe, expect, it } from 'vitest'
import {
  SIGNATURE_COMBOS,
  signatureCombo,
  signatureComboCounts,
  signatureHits,
} from './signatureCombos'
import { createSignatureFight, playSignatureCombo } from './signatureComboRunner'
import { dashCancel } from './dashCancel'
import { ACCEL_HEAT_MAX } from './accelCancel'
import { throwImmune } from './throwRules'
import { comboAuraCost } from './comboAuraCost'
import { ELASTIC_HOLD_FRAMES, advanceElasticHold } from './elasticHold'
import { performTrainingAction } from './trainingAction'
import { EMPTY_INPUT, type ArcadeFighter, type FightState } from './types'

describe('signature combos are true combos through real commands', () => {
  for (const combo of SIGNATURE_COMBOS)
    for (const mirrored of [false, true])
      it.each([5, 7])(`${combo.id}, mirrored=${mirrored}, gap=%s`, (gap) => {
        const run = playSignatureCombo(combo, createSignatureFight(combo, { mirrored, gap }))
        expect(run.reached).toBe(combo.steps.length)
        expect(run.contacts.map((hit) => hit.move)).toEqual(
          signatureHits(combo).map((slot) => `${combo.fighter}:${slot}`),
        )
        expect(run.contacts.map((hit) => hit.combo)).toEqual(signatureComboCounts(combo))
        expect(run.contacts.some((hit) => hit.blocked)).toBe(false)
      })
})

describe('Verdict écarlate', () => {
  const play = (id: string) => {
    const combo = signatureCombo(id)
    return playSignatureCombo(combo, createSignatureFight(combo, { mirrored: false, gap: 5 }))
  }

  it('implants Judgment Chain under Emperor Time, after a capture', () => {
    const { state } = play('kurapika:scarlet-verdict')
    expect(state.player.kurapika?.emperorTime).toBe(true)
    expect(state.opponent.judgmentChain?.owner).toBe('player')
    expect(state.player.health).toBeGreaterThan(0)
  })

  it('jails a Troupe member with Chain Jail in the variant', () => {
    const { state, contacts } = play('kurapika:scarlet-verdict-troupe')
    expect(contacts[5].move).toBe('kurapika:neutralSpecial')
    expect(state.opponent.judgmentChain?.owner).toBe('player')
    expect(state.player.health).toBeGreaterThan(0)
  })

  it('keeps Chain Jail bound by its vow against anyone outside the Troupe', () => {
    const variant = signatureCombo('kurapika:scarlet-verdict-troupe')
    const combo = { ...variant, opponent: 'hisoka' as const, steps: variant.steps.slice(0, 7) }
    const { state } = playSignatureCombo(
      combo,
      createSignatureFight(combo, { mirrored: false, gap: 5 }),
    )
    expect(state.opponent.comboHits).toBe(5)
    const jailed = performTrainingAction({ state, side: 'player', action: 'special' })
    expect(jailed.opponent.chainJail).toBeUndefined()
    // The lab spares the body, but the vow is broken exactly as in a match.
    expect(jailed.player.kurapika?.vowBroken).toBe(true)
  })
})

describe('Élastique meurtrier', () => {
  it('lands the execution with a single full aura bar and consumes the link', () => {
    const combo = signatureCombo('hisoka:elastic-murder')
    const { state } = playSignatureCombo(
      combo,
      createSignatureFight(combo, { mirrored: false, gap: 5 }),
    )
    expect(state.player.aura).toBeLessThan(10)
    expect(
      state.gumNetwork?.links.some(
        (link) => link.target.kind === 'fighter' && link.target.side === 'opponent',
      ) ?? false,
    ).toBe(false)
  })
})

function ready(fighter: 'kurapika' | 'hisoka'): FightState {
  const combo = SIGNATURE_COMBOS.find((entry) => entry.fighter === fighter)!
  return createSignatureFight(combo, { mirrored: false, gap: 5 })
}

/** The hook of Kurapika, frozen at its first active frame, with or without a confirmed hit. */
function hooking(confirmedHit: boolean): ArcadeFighter {
  const { player } = ready('kurapika')
  return {
    ...player,
    attack: {
      moveId: 'kurapika:standingHeavy',
      kind: 'heavy',
      confirmedHit,
      frame: 9,
      impacted: confirmedHit,
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
      projectileSpawned: false,
      reversal: false,
    },
  }
}
/** Two frames of a double tap backward, the second completing it. */
function doubleTapBack(fighter: ArcadeFighter): ArcadeFighter | null {
  const back = { ...EMPTY_INPUT, left: fighter.facing === 1, right: fighter.facing === -1 }
  const motion = {
    ...fighter.motion!,
    heldDirection: 0 as const,
    tapDirection: -fighter.facing as -1 | 1,
    tapWindow: 5,
  }
  return dashCancel({ ...fighter, motion }, back)
}

describe('accélération', () => {
  it('cancels a confirmed hit into a dash in the listed direction', () => {
    const dashed = doubleTapBack(hooking(true))
    expect(dashed?.attack).toBeNull()
    expect(dashed?.motion?.dash).toMatchObject({ direction: -1, accel: true })
    expect(dashed?.accelHeat?.heat).toBe(50)
  })

  it('is refused on a whiff, in the other direction, and while the Ren overheats', () => {
    expect(doubleTapBack(hooking(false))).toBeNull()
    const lowLight = {
      ...hooking(true),
      attack: { ...hooking(true).attack!, moveId: 'kurapika:lowLight' },
    }
    expect(doubleTapBack(lowLight)).toBeNull()
    const hot = { ...hooking(true), accelHeat: { heat: ACCEL_HEAT_MAX, overheated: true } }
    expect(doubleTapBack(hot)).toBeNull()
  })
})

describe('combo capture', () => {
  it('seizes a stunned or downed body only when it ends an accélération', () => {
    const { opponent } = ready('kurapika')
    const stunned = { ...opponent, hitStun: 10, knockdownFrames: 20 }
    expect(throwImmune(stunned)).toBe(true)
    expect(throwImmune(stunned, true)).toBe(false)
    expect(throwImmune({ ...stunned, y: 4 }, true)).toBe(true)
  })
})

describe('Hisoka combo prices and tension élastique', () => {
  it('discounts recall, rebound and execution only while the opponent is held in the combo', () => {
    const state = ready('hisoka')
    expect(comboAuraCost(state, 'player', 'hisoka:forwardSpecial')).toBeUndefined()
    const held = { ...state, opponent: { ...state.opponent, comboHits: 3, hitStun: 10 } }
    expect(comboAuraCost(held, 'player', 'hisoka:forwardSpecial')).toBe(5)
    expect(comboAuraCost(held, 'player', 'hisoka:backSpecial')).toBe(5)
    expect(comboAuraCost(held, 'player', 'hisoka:finisher')).toBeUndefined()
    const tense = { ...held, player: { ...held.player, elasticHold: 30 } }
    expect(comboAuraCost(tense, 'player', 'hisoka:finisher')).toBe(40)
    expect(comboAuraCost(held, 'player', 'hisoka:neutralSpecial')).toBeUndefined()
  })

  it('never holds beyond its budget', () => {
    const state = ready('hisoka')
    const spent: FightState = {
      ...state,
      player: { ...state.player, elasticHold: ELASTIC_HOLD_FRAMES, y: 10 },
      opponent: { ...state.opponent, comboHits: 4, hitStun: 6 },
    }
    expect(advanceElasticHold(spent).opponent.hitStun).toBe(6)
  })
})
