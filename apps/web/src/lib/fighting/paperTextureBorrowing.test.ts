import { describe, expect, it } from 'vitest'
import { createFight } from './engine'
import { createKurapika } from './kurapika'
import { captureDolphinAura } from './dolphinAura'
import { dolphinIsBusy } from './kurapikaDolphin'
import { equippedDolphin } from './dolphinBorrowing'
import { copyHistoricalObject } from './chrolloHistoricalObjects'
import { GALLERY_FAKE_LIFETIME } from './historicalCopyLifetime'
import { reconcileChrolloPages } from './chrolloPageEffects'
import { displayedDocumentText } from './paperTexture'
import {
  paperSetup,
  paperCommand,
  paperFrames,
  preparePaper,
  note,
  paperId,
} from './paperDocumentTestSetup'
import type { FightState } from './types'

function loanSetup(): FightState {
  const state = paperSetup('chrollo', 'kurapika')
  return {
    ...state,
    player: {
      ...state.player,
      aura: 0,
      auraExhausted: true,
      chrolloBook: {
        pages: ['hisoka:downSpecial'],
        open: false,
        bookmark: 'hisoka:downSpecial',
        page: 0,
      },
      dolphinLoan: {
        lender: { owner: 'opponent', member: 0 },
        held: {
          source: 'hisoka',
          moveId: 'hisoka:downSpecial',
          victim: 'opponent',
          theftId: 'paper-loan',
          loaded: true,
          used: false,
          sustainedKeys: [],
          auraSupply: { ...captureDolphinAura(createFight('hisoka', 'theta').player), amount: 60 },
        },
      },
    },
    opponent: {
      ...state.opponent,
      kurapika: {
        ...createKurapika(),
        emperorTime: true,
        dolphinLoans: [{ owner: 'player', member: 0 }],
      },
    },
  }
}
describe('a paper disguise retains its actual copied or borrowed source', () => {
  it('spends only donor aura, maintains the loan and finishes without deleting the real paper', () => {
    let state = loanSetup()
    state = paperCommand(state, { action: 'document-take', target: paperId })
    state = paperCommand(state, { action: 'texture-paper', target: paperId, loan: true })
    state = paperCommand(state, {
      action: 'texture-paper-text',
      target: 'borrowed surface',
      loan: true,
    })
    const cast = paperCommand(state, { action: 'dolphin-use' })
    expect(cast.player.aura).toBe(0)
    state = paperFrames(cast)
    expect(note(state).document!.textures?.[0]).toMatchObject({
      source: 'dolphin',
      theftId: 'paper-loan',
      text: 'borrowed surface',
    })
    expect(equippedDolphin(state.player)?.auraSupply?.amount).toBe(40)
    expect(dolphinIsBusy(state, 'player', equippedDolphin(state.player)!)).toBe(true)
    const ended = paperCommand(state, { action: 'dolphin-use' })
    expect(note(ended).present).toBe(true)
    expect(displayedDocumentText(ended, note(ended))).toBe('Document 01 · 18:00')
    expect(note(ended).document!.holder).toEqual(note(state).document!.holder)
  })
  it('does not use recipient reserves when the donor cannot pay or produce a second fresh application', () => {
    let state = loanSetup()
    state = paperCommand(state, { action: 'document-take', target: paperId })
    state = paperCommand(state, { action: 'texture-paper', target: paperId, loan: true })
    const loan = state.player.dolphinLoan!
    const poor = {
      ...state,
      player: {
        ...state.player,
        aura: 100,
        auraExhausted: false,
        dolphinLoan: {
          ...loan,
          held: { ...loan.held, auraSupply: { ...loan.held.auraSupply!, amount: 19 } },
        },
      },
    }
    expect(paperCommand(poor, { action: 'dolphin-use' })).toBe(poor)
    state = paperFrames(paperCommand(state, { action: 'dolphin-use' }))
    const removed = paperCommand(state, {
      action: 'texture-paper-remove',
      target: paperId,
      loan: true,
    })
    const attempted = paperCommand(removed, { action: 'dolphin-use' })
    expect(attempted.player.attack).toBeNull()
    expect(note(attempted).document!.textures).toBeUndefined()
    expect(attempted.player.dolphinLoan).toBeUndefined()
  })
  it('ends a book layer immediately on page closure and never resurrects it on reopening', () => {
    let state = loanSetup()
    state = { ...state, player: { ...state.player, aura: 100, auraExhausted: false } }
    state = preparePaper(state, 'book surface')
    state = paperFrames(
      paperCommand(state, { action: 'copied-move', target: 'hisoka:downSpecial' }),
    )
    expect(note(state).document!.textures?.[0]?.source).toBe('book')
    const closed = reconcileChrolloPages(
      state,
      {
        ...state,
        player: { ...state.player, chrolloBook: { ...state.player.chrolloBook!, bookmark: null } },
      },
      'player',
    )
    expect(displayedDocumentText(closed, note(closed))).toBe('Document 01 · 18:00')
    // Reopen from the current matter, never restore a discarded previous state.
    const current = reconcileChrolloPages(closed, { ...closed, player: state.player }, 'player')
    expect(note(current).document!.textures).toBeUndefined()
  })
  it('maintains book and Dolphin layers independently on the same real paper', () => {
    let state = loanSetup()
    state = { ...state, player: { ...state.player, aura: 100, auraExhausted: false } }
    state = preparePaper(state, 'book surface')
    state = paperFrames(
      paperCommand(state, { action: 'copied-move', target: 'hisoka:downSpecial' }),
    )
    state = paperCommand(state, {
      action: 'texture-paper-text',
      target: 'loan surface',
      loan: true,
    })
    state = paperFrames(paperCommand(state, { action: 'dolphin-use' }))
    expect(note(state).document!.textures?.map((layer) => layer.source)).toEqual([
      'book',
      'dolphin',
    ])
    expect(displayedDocumentText(state, note(state))).toBe('loan surface')
    const ended = paperCommand(state, { action: 'dolphin-use' })
    expect(displayedDocumentText(ended, note(ended))).toBe('book surface')
    expect(note(ended).document!.textures?.map((layer) => layer.source)).toEqual(['book'])
    const closed = reconcileChrolloPages(
      state,
      {
        ...state,
        player: { ...state.player, chrolloBook: { ...state.player.chrolloBook!, bookmark: null } },
      },
      'player',
    )
    expect(displayedDocumentText(closed, note(closed))).toBe('loan surface')
    expect(dolphinIsBusy(closed, 'player', equippedDolphin(closed.player)!)).toBe(true)
  })
  it('loses an expired copied support during hitstop and releases its single-use loan afterward', () => {
    const base = loanSetup()
    let state: FightState = {
      ...base,
      player: {
        ...base.player,
        aura: 100,
        auraExhausted: false,
        chrolloBook: { pages: ['gallery-fake'], page: 0, open: false, bookmark: 'gallery-fake' },
      },
    }
    state = copyHistoricalObject(state, 'player', paperId)
    const copy = state.battlefield!.entities.find((entry) => entry.copy?.originalId === paperId)!
    expect(copy).toBeTruthy()
    state = paperFrames(state, 20)
    state = paperCommand(state, { action: 'texture-paper', target: copy.id, loan: true })
    state = paperCommand(state, {
      action: 'texture-paper-text',
      target: 'copied support',
      loan: true,
    })
    state = paperFrames(paperCommand(state, { action: 'dolphin-use' }))
    expect(dolphinIsBusy(state, 'player', equippedDolphin(state.player)!)).toBe(true)
    state = paperFrames(
      { ...state, frame: copy.copy!.createdAt + GALLERY_FAKE_LIFETIME - 1, hitstop: 10 },
      1,
    )
    const expired = state.battlefield!.entities.find((entry) => entry.id === copy.id)!
    expect(expired.present).toBe(false)
    expect(expired.document!.textures).toBeUndefined()
    expect(dolphinIsBusy(state, 'player', equippedDolphin(state.player)!)).toBe(false)
    const returned = paperFrames(state, 20)
    expect(returned.player.dolphinLoan?.held.returned).toBe(true)
    expect(returned.opponent.kurapika?.emperorTime).toBe(true)
    expect(paperCommand(returned, { action: 'dolphin-use' }).player.dolphinLoan).toBeUndefined()
    expect(note(state).document!.text).toBe('Document 01 · 18:00')
  })
})
