import { describe, expect, it } from 'vitest'
import { mapSetup, mapFrames, searchBodyKey } from './dowsingMapTestSetup'
import { needleCommand } from './illumiNeedleFaceTestSetup'
import { documentById } from './paperDocuments'
import { visibleArenaMap } from './arenaMap'
import { copiedDocumentMaterials } from './paperDocumentCopy'
import { copyHistoricalObject } from './chrolloHistoricalObjects'
import { expireHistoricalMatter } from './historicalMatterClock'
import { GALLERY_FAKE_LIFETIME } from './historicalCopyLifetime'
import { privatePvpState } from './pvp/view'
import type { FightState } from './types'

const mapId = 'player:arena-map'
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
function copiedMap(): FightState {
  const state = gallery(mapSetup())
  const copied = copyHistoricalObject(state, 'opponent', mapId)
  const copy = copied.battlefield!.entities.find((entry) => entry.copy?.originalId === mapId)!
  const dropped = needleCommand(
    mapFrames(copied, 20),
    { action: 'document-drop', target: copy.id },
    'opponent',
  )
  return {
    ...dropped,
    battlefield: {
      ...dropped.battlefield!,
      entities: dropped.battlefield!.entities.filter((entry) => entry.id !== mapId),
    },
  }
}
describe('map location obeys physical paper and its real Nen sources', () => {
  it('cannot read or reproduce a diagram under a real Texture Surprise film', () => {
    let state = mapSetup('player', 'hisoka')
    state = { ...state, opponent: { ...state.opponent, x: 27 } }
    for (const command of [
      { action: 'texture-paper' as const, target: mapId },
      { action: 'texture-paper-text' as const, target: 'Aucune carte visible' },
      { action: 'texture-apply' as const },
    ])
      state = needleCommand(state, command, 'opponent')
    state = mapFrames(state, 40)
    const paper = documentById(state, mapId)!
    expect(paper.document?.textures?.length).toBe(1)
    expect(visibleArenaMap(state, paper)).toBeUndefined()
    expect(
      copiedDocumentMaterials(state, { source: paper, id: 'copy', side: 'player' }).document
        ?.arenaMap,
    ).toBeUndefined()
    expect(
      privatePvpState(state, 'player').battlefield!.entities.find((entry) => entry.id === mapId)
        ?.document?.arenaMap,
    ).toBeUndefined()
    expect(needleCommand(state, { action: 'dowsing-locate', target: searchBodyKey(state) })).toBe(
      state,
    )
    const removed = needleCommand(
      state,
      { action: 'texture-paper-remove', target: mapId },
      'opponent',
    )
    expect(visibleArenaMap(removed, documentById(removed, mapId)!)).toBeTruthy()
  })
  it('uses an actual inert Gallery Fake map, then cancels when that exact sheet expires during hitstop', () => {
    const base = copiedMap()
    const copy = base.battlefield!.entities.find((entry) => entry.copy?.originalId === mapId)!
    expect(copy.document?.arenaMap).toEqual({ left: 7, right: 93, bottom: 0, top: 24 })
    expect(copy.document?.textures).toBeUndefined()
    expect(copy.document?.holder).toBeUndefined()
    const started = needleCommand(base, { action: 'dowsing-locate', target: searchBodyKey(base) })
    expect(started.player.dowsingMapSearch?.mapId).toBe(copy.id)
    const read = mapFrames(started)
    expect(read.player.dowsingMapReading?.point).toBeTruthy()
    const expired = expireHistoricalMatter({
      ...read,
      hitstop: 10,
      frame: copy.copy!.createdAt + GALLERY_FAKE_LIFETIME,
    })
    expect(expired.player.dowsingMapSearch).toBeUndefined()
    expect(expired.player.dowsingMapPose).toBeUndefined()
    expect(expired.player.dowsingMapReading).toEqual(read.player.dowsingMapReading)
    expect(expired.battlefield!.entities.find((entry) => entry.id === copy.id)?.present).toBe(false)
  })
  it('requires a bookmarked chain and cancels when its actual book source is lost', () => {
    const base = mapSetup()
    const book = {
      pages: ['kurapika:forwardSpecial'],
      page: 0,
      open: false,
      bookmark: 'kurapika:forwardSpecial',
    } as const
    const caster = {
      ...base,
      player: {
        ...base.player,
        id: 'chrollo' as const,
        chrolloBook: { ...book, pages: [...book.pages] },
      },
    }
    const started = needleCommand(caster, { action: 'dowsing-locate', target: searchBodyKey(base) })
    expect(started.player.dowsingMapSearch?.origin.source).toBe('book')
    const closed = {
      ...started,
      player: {
        ...started.player,
        chrolloBook: { ...started.player.chrolloBook!, bookmark: null },
      },
    }
    expect(
      expireHistoricalMatter({ ...closed, hitstop: 10 }).player.dowsingMapSearch,
    ).toBeUndefined()
    const open = {
      ...caster,
      player: { ...caster.player, chrolloBook: { ...caster.player.chrolloBook!, open: true } },
    }
    expect(needleCommand(open, { action: 'dowsing-locate', target: searchBodyKey(base) })).toBe(
      open,
    )
  })
  it('keeps the same physical subject after its visible appearance changes', () => {
    const base = mapSetup()
    const started = needleCommand(base, { action: 'dowsing-locate', target: searchBodyKey(base) })
    const changed = { ...started, opponent: { ...started.opponent, id: 'theta' as const, x: 80 } }
    const read = mapFrames(changed)
    expect(read.player.dowsingMapReading?.bodyKey).toBe('opponent:0')
    expect(read.player.dowsingMapReading?.appearance).toBe('hisoka')
    expect(read.player.dowsingMapReading?.point?.x).toBeCloseTo(73 / 86)
  })
  it('keeps the chain hand free and retains the physical sheet when a held map blocks activation', () => {
    const base = mapSetup()
    const held = needleCommand(base, { action: 'document-take', target: mapId })
    expect(documentById(held, mapId)?.document?.holder?.hand).toBe('right')
    expect(needleCommand(held, { action: 'dowsing-locate', target: searchBodyKey(base) })).toBe(
      held,
    )
    const dropped = needleCommand(held, { action: 'document-drop', target: mapId })
    const started = needleCommand(dropped, {
      action: 'dowsing-locate',
      target: searchBodyKey(base),
    })
    expect(started.player.dowsingMapSearch).toBeTruthy()
    const occupied = needleCommand(started, { action: 'document-take', target: mapId })
    const stopped = expireHistoricalMatter({ ...occupied, hitstop: 10 })
    expect(stopped.player.dowsingMapSearch).toBeUndefined()
    expect(documentById(stopped, mapId)?.document?.holder?.hand).toBe('right')
  })
})
