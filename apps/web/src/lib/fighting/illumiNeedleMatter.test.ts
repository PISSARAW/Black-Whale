import { describe, expect, it } from 'vitest'
import { nextRound } from './engine'
import {
  needleFaceSetup,
  beginNeedleFace,
  needleFrames,
  needleCommand,
} from './illumiNeedleFaceTestSetup'
import { expireHistoricalMatter } from './historicalMatterClock'
import { GALLERY_FAKE_LIFETIME } from './historicalCopyLifetime'
import { recordEquipmentPickup, advanceCopiedInventory } from './copiedInventory'
import { copyHistoricalObject } from './chrolloHistoricalObjects'
import type { FightState } from './types'

function copiedPins(): FightState {
  const base = needleFaceSetup()
  const id = 'actual-gallery-needles'
  return {
    ...base,
    player: {
      ...base.player,
      equipmentProps: { needles: { entityId: id, copyId: id, material: 'nen' } },
    },
    battlefield: {
      ...base.battlefield!,
      entities: [
        ...base.battlefield!.entities,
        {
          id,
          kind: 'needles',
          owner: 'player',
          x: 44,
          y: 0,
          present: false,
          material: 'nen',
          health: 3,
          copy: { owner: 'player', originalId: 'real-pins', createdAt: 0, headAttached: true },
          arena: { width: 1, height: 1, sun: 'player' },
        },
      ],
    },
  }
}
describe('face pins retain actual matter and Gallery Fake parentage', () => {
  it('retains detached pieces after other material of the same copy is destroyed, then expires them at their parent’s deadline', () => {
    let state = needleFrames(beginNeedleFace(copiedPins()))
    const id = state.opponent.needleFace!.mediumCopyId!
    expect(id).toBe('actual-gallery-needles')
    state = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) =>
          entry.id === id ? { ...entry, health: 0, arena: undefined } : entry,
        ),
      },
      player: {
        ...state.player,
        id: 'chrollo',
        chrolloBook: { pages: ['gallery-fake'], page: 0, open: false, bookmark: 'gallery-fake' },
      },
    }
    expect(expireHistoricalMatter(state).opponent.needleFace).toBeTruthy()
    state = needleCommand(state, { action: 'needle-face-remove' }, 'opponent')
    const pile = state.battlefield!.entities.find((entry) => entry.detachedFaceNeedles)!
    const carried = recordEquipmentPickup(state.opponent, pile, 'needles')
    expect(carried.equipmentProps?.needles).toMatchObject({ copyId: id, detachedPart: true })
    expect(advanceCopiedInventory({ ...state, opponent: carried }).opponent.equipment).toContain(
      'needles',
    )
    const expired = expireHistoricalMatter({ ...state, frame: GALLERY_FAKE_LIFETIME })
    expect(expired.battlefield!.entities.find((entry) => entry.id === pile.id)?.present).toBe(false)
    const next = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(next.battlefield!.entities.find((entry) => entry.id === id)?.copy?.createdAt).toBe(
      -state.frame,
    )
  })
  it('copies an extracted bundle as three inert new pins, without copying its shaping Hatsu', () => {
    let state = needleFrames(beginNeedleFace(needleFaceSetup()))
    state = needleCommand(state, { action: 'needle-face-remove' }, 'opponent')
    const pile = state.battlefield!.entities.find((entry) => entry.detachedFaceNeedles)!
    state = {
      ...state,
      player: {
        ...state.player,
        id: 'chrollo',
        aura: 100,
        x: pile.x,
        attack: null,
        arenaRecovery: 0,
        chrolloBook: { pages: ['gallery-fake'], page: 0, open: false, bookmark: 'gallery-fake' },
      },
    }
    const copied = copyHistoricalObject(state, 'player', pile.id)
    const replica = copied.battlefield!.entities.find(
      (entry) => entry.copy?.originalId === pile.id,
    )!
    expect(replica.detachedFaceNeedles?.needles).toHaveLength(3)
    expect(replica.detachedFaceNeedles?.needles).not.toEqual(pile.detachedFaceNeedles!.needles)
    expect(replica.detachedFaceNeedles?.mediumCopyId).toBe(replica.id)
    expect(replica.controller).toBeUndefined()
    expect(copied.opponent.needleFace).toBeUndefined()
  })
  it('drops the physical extracted pins to the floor and keeps their identities across a round', () => {
    let state = needleFrames(beginNeedleFace(needleFaceSetup()))
    state = needleCommand(
      { ...state, opponent: { ...state.opponent, y: 12 } },
      { action: 'needle-face-remove' },
      'opponent',
    )
    const pile = state.battlefield!.entities.find((entry) => entry.detachedFaceNeedles)!
    expect(pile.y).toBe(12)
    state = needleFrames(state, 60)
    const landed = state.battlefield!.entities.find((entry) => entry.id === pile.id)!
    expect(landed.y).toBe(0)
    const next = nextRound({ ...state, phase: 'finished', winner: 'player' })
    expect(
      next.battlefield!.entities.find((entry) => entry.id === pile.id)?.detachedFaceNeedles
        ?.needles,
    ).toEqual(pile.detachedFaceNeedles!.needles)
  })
})
