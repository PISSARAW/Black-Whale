import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { createKurapika } from './kurapika'
import { captureDolphinAura } from './dolphinAura'
import { equippedDolphin } from './dolphinBorrowing'
import { dolphinIsBusy } from './kurapikaDolphin'
import { expireHistoricalMatter } from './historicalMatterClock'
import { needleCommand, needleFrames } from './illumiNeedleFaceTestSetup'
import { privatePvpState } from './pvp/view'
import type { FightState } from './types'

function setup(): FightState {
  const base = beginFight(
    createFight('chrollo', 'kurapika', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { needleStock: { player: true } },
    }),
  )
  return {
    ...base,
    player: {
      ...base.player,
      x: 44,
      aura: 100,
      chrolloBook: { pages: ['illumi:neutralSpecial'], page: 0, open: true, bookmark: null },
      dolphinLoan: {
        lender: { owner: 'opponent', member: 0 },
        held: {
          source: 'illumi',
          moveId: 'illumi:neutralSpecial',
          victim: 'opponent',
          theftId: 'face-needles-loan',
          loaded: true,
          used: false,
          sustainedKeys: [],
          auraSupply: { ...captureDolphinAura(createFight('illumi', 'theta').player), amount: 60 },
        },
      },
    },
    opponent: {
      ...base.opponent,
      x: 49,
      kurapika: {
        ...createKurapika(),
        emperorTime: true,
        dolphinLoans: [{ owner: 'player', member: 0 }],
      },
    },
  }
}

describe('other-body face shaping retains its actual acquisition', () => {
  it('ends a book shaping effect on page closure without erasing metal or spending a loan', () => {
    let state = needleCommand(setup(), { action: 'illumi-needle-mode', target: 'face-warp' })
    state = needleFrames(
      needleCommand(state, { action: 'copied-move', target: 'illumi:neutralSpecial' }),
    )
    expect(state.opponent.needleFace?.origin.source).toBe('book')
    const pins = state.opponent.needleFace!.needles
    state = expireHistoricalMatter({
      ...state,
      player: { ...state.player, chrolloBook: { ...state.player.chrolloBook!, open: false } },
    })
    expect(state.opponent.needleFace).toMatchObject({ needles: pins, reshaping: false })
    expect(state.player.dolphinLoan?.held.used).toBe(false)
  })
  it('uses only the finite donor aura and keeps the loan busy until physical extraction or dismissal', () => {
    const base = setup()
    let state: FightState = {
      ...base,
      player: { ...base.player, id: 'theta', aura: 0, auraExhausted: true, chrolloBook: undefined },
    }
    state = needleCommand(state, { action: 'illumi-needle-mode', target: 'face-warp', loan: true })
    state = needleCommand(state, { action: 'dolphin-move', target: 'illumi:neutralSpecial' })
    expect(state.player.aura).toBe(0)
    state = needleFrames(state)
    expect(state.opponent.needleFace?.origin).toMatchObject({
      source: 'dolphin',
      theftId: 'face-needles-loan',
    })
    expect(equippedDolphin(state.player)?.auraSupply?.amount).toBe(20)
    expect(dolphinIsBusy(state, 'player', equippedDolphin(state.player)!)).toBe(true)
    const privateOwner = privatePvpState(state, 'player')
    expect(privateOwner.opponent.needleFace?.origin.source).toBe('dolphin')
    expect(privatePvpState(state, 'opponent').player.needleFace?.origin).toEqual({})
    state = needleCommand(state, { action: 'dolphin-use' })
    expect(state.opponent.needleFace?.reshaping).toBe(false)
    expect(state.opponent.needleFace?.needles).toHaveLength(3)
    expect(
      needleCommand(state, { action: 'dolphin-move', target: 'illumi:neutralSpecial' }).player
        .attack,
    ).toBeNull()
  })
  it('cannot replace missing donor funds with the borrower’s own aura', () => {
    const base = setup()
    const loan = base.player.dolphinLoan!
    let state: FightState = {
      ...base,
      player: {
        ...base.player,
        id: 'theta',
        chrolloBook: undefined,
        dolphinLoan: {
          ...loan,
          held: { ...loan.held, auraSupply: { ...loan.held.auraSupply!, amount: 39 } },
        },
      },
    }
    state = needleCommand(state, { action: 'illumi-needle-mode', target: 'face-warp', loan: true })
    expect(needleCommand(state, { action: 'dolphin-move', target: 'illumi:neutralSpecial' })).toBe(
      state,
    )
  })
})
