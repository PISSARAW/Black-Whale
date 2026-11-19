import { describe, expect, it } from 'vitest'
import { copyHistoricalObject } from './chrolloHistoricalObjects'
import { expireHistoricalMatter } from './historicalMatterClock'
import { GALLERY_FAKE_LIFETIME } from './historicalCopyLifetime'
import { paperSetup, paperCommand, maskPaper, note, paperId } from './paperDocumentTestSetup'
import { displayedDocumentText } from './paperTexture'
import type { FightState } from './types'

function gallery(state: FightState): FightState {
  return {
    ...state,
    opponent: {
      ...state.opponent,
      id: 'chrollo',
      x: 28,
      aura: 100,
      chrolloBook: { pages: ['gallery-fake'], page: 0, open: false, bookmark: 'gallery-fake' },
    },
  }
}
describe('Gallery Fake copies actual paper with actual hands and a finite life', () => {
  it('reproduces the visible surface as an inert facsimile without copying Texture Surprise or uncovering ink', () => {
    let state = gallery(maskPaper(paperSetup()))
    state = copyHistoricalObject(state, 'opponent', paperId)
    const copy = state.battlefield!.entities.find((entry) => entry.copy?.originalId === paperId)!
    expect(copy).toBeTruthy()
    expect(copy.document!.text).toBe('Document 01 · 21:00')
    expect(copy.document!.textures).toBeUndefined()
    expect(copy.document!.holder).toEqual({ owner: 'opponent', member: 0, hand: 'right' })
    expect(copy.health).toBe(note(state).health)
    state = paperCommand(state, { action: 'texture-paper-remove', target: paperId })
    expect(displayedDocumentText(state, note(state))).toBe('Document 01 · 18:00')
    expect(displayedDocumentText(state, copy)).toBe('Document 01 · 21:00')
    const expired = expireHistoricalMatter({
      ...state,
      frame: copy.copy!.createdAt + GALLERY_FAKE_LIFETIME,
      hitstop: 10,
    })
    const gone = expired.battlefield!.entities.find((entry) => entry.id === copy.id)!
    expect(gone.present).toBe(false)
    expect(gone.document!.holder).toBeUndefined()
    expect(note(expired).present).toBe(true)
  })
  it('accepts an original already in the left hand while requiring the right hand to be free', () => {
    let state = paperSetup('chrollo')
    state = {
      ...state,
      player: {
        ...state.player,
        chrolloBook: { pages: ['gallery-fake'], page: 0, open: true, bookmark: null },
      },
    }
    state = paperCommand(state, { action: 'document-take', target: paperId })
    expect(note(state).document!.holder?.hand).toBe('left')
    expect(copyHistoricalObject(state, 'player', paperId)).toBe(state)
    state = {
      ...state,
      player: {
        ...state.player,
        chrolloBook: { ...state.player.chrolloBook!, open: false, bookmark: 'gallery-fake' },
      },
    }
    const copied = copyHistoricalObject(state, 'player', paperId)
    expect(copied.battlefield!.entities.some((entry) => entry.copy?.originalId === paperId)).toBe(
      true,
    )
  })
})
