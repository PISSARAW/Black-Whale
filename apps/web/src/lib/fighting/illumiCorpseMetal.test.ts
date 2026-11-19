import { describe, expect, it } from 'vitest'
import { controlledCorpse, corpseEntry } from './illumiCorpseTestSetup'
import { needleCommand } from './illumiNeedleFaceTestSetup'
import { mapFrames } from './dowsingMapTestSetup'
import { copyHistoricalObject } from './chrolloHistoricalObjects'
import { expireHistoricalMatter } from './historicalMatterClock'
import { GALLERY_FAKE_LIFETIME } from './historicalCopyLifetime'
import { interactWithPreparation } from './preparationSimulation'
import type { FightState } from './types'

function gallery(state: FightState): FightState {
  return {
    ...state,
    opponent: {
      ...state.opponent,
      id: 'chrollo',
      x: 30,
      aura: 100,
      chrolloBook: { pages: ['gallery-fake'], page: 0, open: false, bookmark: 'gallery-fake' },
    },
  }
}
describe('corpse needles remain actual finite material through extraction and copies', () => {
  it('moves a retrieved assembly from the floor into the next corpse without multiplying it', () => {
    let state = controlledCorpse()
    const pins = corpseEntry(state).corpseNeedles!
    state = needleCommand(state, { action: 'illumi-corpse-release', target: 'player:corpse' })
    const dropId = state.battlefield!.entities.find((entry) => entry.corpsePinBundle)!.id
    state = {
      ...state,
      opponent: {
        ...state.opponent,
        id: 'chrollo',
        x: 30,
        aura: 100,
        chrolloBook: { pages: ['illumi:neutralSpecial'], page: 0, open: true, bookmark: null },
      },
    }
    state = interactWithPreparation(state, 'opponent')
    expect(state.opponent.equipmentProps?.needles?.entityId).toBe(dropId)
    expect(state.opponent.equipmentProps?.needles?.detachedPart).toBe(true)
    expect(corpseEntry(state, dropId).present).toBe(false)
    state = mapFrames(
      needleCommand(state, { action: 'illumi-corpse', target: 'player:corpse' }, 'opponent'),
      60,
    )
    expect(corpseEntry(state).corpseNeedles).toEqual(pins)
    expect(corpseEntry(state).corpseControl).toMatchObject({
      owner: { owner: 'opponent', member: 0 },
      origin: { source: 'book' },
    })
    expect(state.opponent.equipment).not.toContain('needles')
    expect(state.opponent.equipmentProps?.needles).toBeUndefined()
    state = needleCommand(
      state,
      { action: 'illumi-corpse-release', target: 'player:corpse' },
      'opponent',
    )
    expect(state.battlefield!.entities.filter((entry) => entry.id === dropId)).toHaveLength(1)
    expect(corpseEntry(state, dropId).corpsePinBundle).toEqual(pins)
  })
  it('copies inert metal on a corpse and expires a detached part with its actual parent during hitstop', () => {
    let state = copyHistoricalObject(gallery(controlledCorpse()), 'opponent', 'player:corpse')
    const copy = state.battlefield!.entities.find(
      (entry) => entry.copy?.originalId === 'player:corpse',
    )!
    expect(copy.corpseNeedles?.id).not.toBe(corpseEntry(state).corpseNeedles?.id)
    expect(copy.corpseNeedles?.mediumCopyId).toBe(copy.id)
    expect(copy.corpseControl).toBeUndefined()
    expect(copy.controller).toBeUndefined()
    expect(copy.arena?.height).toBe(3)
    state = { ...state, player: { ...state.player, x: copy.x - 4 } }
    expect(needleCommand(state, { action: 'illumi-corpse', target: copy.id })).toBe(state)
    state = needleCommand(state, { action: 'illumi-corpse-release', target: copy.id })
    const drop = state.battlefield!.entities.find(
      (entry) => entry.corpsePinBundle?.mediumCopyId === copy.id,
    )!
    expect(drop).toBeTruthy()
    expect(drop.material).toBe('nen')
    const expired = expireHistoricalMatter({
      ...state,
      hitstop: 10,
      frame: copy.copy!.createdAt + GALLERY_FAKE_LIFETIME,
    })
    expect(corpseEntry(expired, drop.id).present).toBe(false)
    expect(corpseEntry(expired).corpseNeedles).toEqual(corpseEntry(state).corpseNeedles)
  })
  it('keeps a detached copied assembly after damage to its parent, but cannot pick it up after its lifetime', () => {
    let state = copyHistoricalObject(gallery(controlledCorpse()), 'opponent', 'player:corpse')
    const copy = state.battlefield!.entities.find(
      (entry) => entry.copy?.originalId === 'player:corpse',
    )!
    state = {
      ...state,
      player: { ...state.player, x: copy.x - 4, equipment: [], equipmentProps: {} },
    }
    state = needleCommand(state, { action: 'illumi-corpse-release', target: copy.id })
    const drop = state.battlefield!.entities.find(
      (entry) => entry.corpsePinBundle?.mediumCopyId === copy.id,
    )!
    const damaged = {
      ...state,
      battlefield: {
        ...state.battlefield!,
        entities: state.battlefield!.entities.map((entry) =>
          entry.id === copy.id ? { ...entry, health: 0 } : entry,
        ),
      },
    }
    const expiredBeforePickup = { ...damaged, frame: copy.copy!.createdAt + GALLERY_FAKE_LIFETIME }
    expect(interactWithPreparation(expiredBeforePickup, 'player').player.equipment).not.toContain(
      'needles',
    )
    const picked = interactWithPreparation(damaged, 'player')
    expect(picked.player.equipmentProps?.needles).toMatchObject({
      entityId: drop.id,
      copyId: copy.id,
      detachedPart: true,
    })
    const kept = expireHistoricalMatter({
      ...picked,
      hitstop: 10,
      frame: copy.copy!.createdAt + GALLERY_FAKE_LIFETIME - 1,
    })
    expect(kept.player.equipment).toContain('needles')
    const expired = expireHistoricalMatter({ ...kept, frame: kept.frame + 1 })
    expect(expired.player.equipment).not.toContain('needles')
    expect(expired.player.equipmentProps?.needles).toBeUndefined()
  })
})
