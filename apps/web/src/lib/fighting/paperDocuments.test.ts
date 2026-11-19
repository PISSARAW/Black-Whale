import { describe, expect, it } from 'vitest'
import { nextRound } from './engine'
import { actualDocuments, documentPosition } from './paperDocuments'
import { physicalHandOccupancy } from './deviceHands'
import { projectHanzo } from './hanzoProjection'
import { paperSetup, paperCommand, paperFrames, note, paperId } from './paperDocumentTestSetup'

describe('actual document material and physical handling', () => {
  it('provides only explicitly prepared notes, with no fortune or personal information', () => {
    const state = paperSetup()
    expect(actualDocuments(state)).toHaveLength(2)
    expect(note(state).document).toEqual({ text: 'Document 01 · 18:00' })
    expect(note(state).material).toBe('real')
  })
  it('takes, carries, drops and retakes the same paper with actual hand occupancy', () => {
    let state = paperCommand(paperSetup(), { action: 'document-take', target: paperId })
    const hand = note(state).document!.holder!.hand
    expect(physicalHandOccupancy(state, 'player').has(hand)).toBe(true)
    state = { ...state, player: { ...state.player, x: 40 } }
    expect(documentPosition(state, note(state)).x).toBe(42)
    state = paperCommand(state, { action: 'document-drop', target: paperId })
    expect(note(state).document!.holder).toBeUndefined()
    state = paperFrames(state, 60)
    expect(note(state).y).toBe(0)
    const taken = paperCommand(state, { action: 'document-take', target: paperId })
    expect(note(taken).document!.holder).toBeTruthy()
    expect(actualDocuments(taken)).toHaveLength(2)
  })
  it('requires contact and cannot create a third hand', () => {
    const state = paperSetup()
    expect(
      paperCommand(state, { action: 'document-take', target: 'opponent:scenario-document' }),
    ).toBe(state)
    let held = paperCommand(state, { action: 'document-take', target: paperId })
    held = paperCommand(held, { action: 'writing-take', target: 'player:writing-kit' })
    held = paperCommand(held, { action: 'document-draw' })
    expect(physicalHandOccupancy(held, 'player').size).toBe(2)
    expect(paperCommand(held, { action: 'document-draw' })).toBe(held)
  })
  it('uses a finite existing kit, including physical actions in Zetsu', () => {
    let state = paperCommand(paperSetup('theta'), {
      action: 'writing-take',
      target: 'player:writing-kit',
    })
    state = { ...state, player: { ...state.player, nen: { ...state.player.nen, mode: 'zetsu' } } }
    for (let index = 1; index <= 3; index++) {
      state = paperCommand(state, { action: 'document-draw' })
      const id = `player:writing-kit:sheet:${index}`
      expect(state.battlefield!.entities.find((entry) => entry.id === id)?.document?.text).toBe('')
      state = paperCommand(state, { action: 'document-drop', target: id })
    }
    expect(state.player.writingKit?.sheets).toBe(0)
    expect(paperCommand(state, { action: 'document-draw' })).toBe(state)
    expect(state.player.aura).toBe(100)
  })
  it('does not replenish consumed paper or respawn taken notes between rounds', () => {
    let state = paperCommand(paperSetup('basho'), { action: 'document-draw' })
    state = paperCommand(state, { action: 'document-take', target: paperId })
    const next = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(next.player.writingKit?.sheets).toBe(state.player.writingKit?.sheets)
    expect(next.battlefield!.entities.filter((entry) => entry.id === paperId)).toHaveLength(1)
    expect(note(next).document!.holder).toEqual(note(state).document!.holder)
  })
  it('leaves a carried sheet with Hanzo’s sleeping body and gives the projection no physical hand', () => {
    let state = paperCommand(paperSetup('hanzo'), { action: 'document-take', target: paperId })
    state = { ...state, player: { ...projectHanzo(state.player), x: 70 } }
    expect(documentPosition(state, note(state)).x).toBe(28)
    expect(paperCommand(state, { action: 'document-drop', target: paperId })).toBe(state)
    expect(
      paperCommand(state, { action: 'document-take', target: 'opponent:scenario-document' }),
    ).toBe(state)
  })
})
