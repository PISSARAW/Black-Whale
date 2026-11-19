import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { performArsenalCommand, arsenalOptions } from './retrospectiveArsenal'
import { advanceGallerySenses, liveGalleryContacts } from './gallerySense'
import { physicalHandOccupancy } from './deviceHands'
import { copyHistoricalObject, GALLERY_FAKE_LIFETIME } from './chrolloHistoricalObjects'
import { updateEntity } from './preparationWorld'
import { currentlyLocatedTarget } from './opponentAwareness'
import { privatePvpState, localPerspective } from './pvp/view'
import { gallerySenseAi } from './galleryAi'
import { createTeamFight, requestTeamAssist } from './teamMatch'
import { morenaPresent } from './preparationRequirements'
import { performPreparedAction } from './preparationActions'
import { damageArenaObject } from './arenaSimulation'
import { stampHistoricalPuppet } from './chrolloHistoricalObjects'
import { EMPTY_INPUT, type FightState } from './types'

function ready(): FightState {
  const base = beginFight(
    createFight('chrollo', 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        stageId: 'heilly-hideout',
        morenaPresent: true,
        preparation: {
          mode: 'scenario',
          resources: ['objects', 'rooms', 'devices', 'writing', 'plants'],
          cohorts: ['player'],
        },
      },
    }),
  )
  return {
    ...base,
    player: {
      ...base.player,
      x: 25,
      aura: 100,
      chrolloBook: {
        pages: ['gallery-fake', 'bill'],
        page: 0,
        open: false,
        bookmark: 'gallery-fake',
      },
    },
    opponent: { ...base.opponent, x: 75 },
  }
}
function advance(state: FightState, count = 19): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function copy(state: FightState, target: string): FightState {
  const next = performArsenalCommand(state, 'player', { action: 'history-use', target })
  expect(next).not.toBe(state)
  return advance(next)
}
function locate(state: FightState, target: string): FightState {
  return performArsenalCommand(state, 'player', { action: 'history-gallery-locate', target })
}
function copies(state: FightState) {
  return state.battlefield!.entities.filter((e) => e.copy)
}
function roomCopy(): FightState {
  const made = copy(ready(), 'player:room')
  return updateEntity(made, copies(made)[0].id, { x: 80 })
}

describe('Gallery Fake locates real copies from contact with the actual original', () => {
  it('does not restore a severed head by making a second copy of the headless puppet', () => {
    const base = ready()
    const near = { ...base, opponent: { ...base.opponent, x: 30 } }
    const first = copy(near, 'opponent')
    const original = copies(first)[0]
    const severed = damageArenaObject(first, original.id, { damage: 16, zone: 'head' })
    const second = copyHistoricalObject(severed, 'player', original.id)
    expect(copies(second)).toHaveLength(2)
    expect(copies(second)[1].copy?.headAttached).toBe(false)
    const active = {
      ...second,
      player: {
        ...second.player,
        chrolloBook: {
          pages: ['order-stamp' as const, 'gallery-fake' as const],
          page: 0,
          open: true,
          bookmark: 'gallery-fake' as const,
        },
      },
    }
    expect(stampHistoricalPuppet(active, 'player', copies(second)[1].id)).toBe(active)
  })
  it('can create another copy while the left hand keeps touching that original, and releases a redirected contact', () => {
    const first = locate(copy(ready(), 'player:crate'), 'player:crate')
    const second = copy(first, 'player:crate')
    expect(copies(second)).toHaveLength(2)
    expect(second.player.chrolloHistorical?.galleryFocus?.originalId).toBe('player:crate')
    expect(second.player.chrolloHistorical?.galleryReading?.copies).toHaveLength(2)
    const redirected = copyHistoricalObject(second, 'player', 'player:device:camera')
    expect(copies(redirected)).toHaveLength(3)
    expect(redirected.player.chrolloHistorical?.galleryFocus).toBeUndefined()
  })
  it('locates multiple copies without touching them and lists an executable command', () => {
    let state = copy(copy(ready(), 'player:crate'), 'player:crate')
    state = updateEntity(state, copies(state)[1].id, { x: 82 })
    const option = arsenalOptions(state, 'player').find(
      (o) => o.command.action === 'history-gallery-locate' && o.command.target === 'player:crate',
    )!
    expect(option.ready).toBe(true)
    const located = locate(state, 'player:crate')
    expect(located.player.chrolloHistorical?.galleryReading?.copies.map((c) => c.x)).toEqual([
      20, 82,
    ])
    expect(physicalHandOccupancy(located, 'player').has('left')).toBe(true)
    const stopped = performArsenalCommand(located, 'player', { action: 'history-gallery-stop' })
    expect(stopped.player.chrolloHistorical?.galleryFocus).toBeUndefined()
    expect(stopped.player.chrolloHistorical?.galleryReading).toEqual(
      located.player.chrolloHistorical?.galleryReading,
    )
  })
  it('reserves the left hand and allows holding the actual original there while the book occupies the right', () => {
    let state = copy(ready(), 'player:device:camera')
    state = {
      ...state,
      player: { ...state.player, chrolloBook: { ...state.player.chrolloBook!, open: true } },
    }
    state = performArsenalCommand(state, 'player', {
      action: 'device-pickup',
      target: 'player:device:camera',
    })
    expect(physicalHandOccupancy(state, 'player').size).toBe(2)
    expect(locate(state, 'player:crate')).toBe(state)
    expect(
      locate(state, 'player:device:camera').player.chrolloHistorical?.galleryFocus?.originalId,
    ).toBe('player:device:camera')
    expect(copyHistoricalObject(state, 'player', 'player:crate')).toBe(state)
  })
  it('requires actual contact, ends live sensing on interruption and keeps only a dated observation', () => {
    const state = locate(roomCopy(), 'player:room')
    const reading = state.player.chrolloHistorical!.galleryReading!
    const away = { ...state, frame: state.frame + 1, player: { ...state.player, x: 40 } }
    const moved = updateEntity(away, copies(away)[0].id, { x: 90 })
    expect(liveGalleryContacts(moved, 'player')).toEqual([])
    const stopped = advanceGallerySenses(moved)
    expect(stopped.player.chrolloHistorical?.galleryFocus).toBeUndefined()
    expect(stopped.player.chrolloHistorical?.galleryReading).toEqual(reading)
    expect(locate(stopped, 'player:room')).toBe(stopped)
  })
  it('uses each copy’s volume rather than a universal remote En radius, including a body in Zetsu', () => {
    const made = roomCopy()
    const hidden = {
      ...made,
      player: { ...made.player, hatsuEffects: { ...made.player.hatsuEffects, senseSeals: 1 } },
      opponent: { ...made.opponent, x: 80, nen: { ...made.opponent.nen, mode: 'zetsu' as const } },
    }
    const sensed = locate(hidden, 'player:room')
    expect(copies(sensed)[0].arena).toBeUndefined()
    expect(liveGalleryContacts(sensed, 'player').find((p) => p.side === 'opponent')).toMatchObject({
      x: 80,
      y: 0,
    })
    const outside = { ...sensed, opponent: { ...sensed.opponent, x: 86.01 } }
    expect(liveGalleryContacts(outside, 'player').some((p) => p.side === 'opponent')).toBe(false)
    const above = { ...sensed, opponent: { ...sensed.opponent, y: 16.01 } }
    expect(liveGalleryContacts(above, 'player').some((p) => p.side === 'opponent')).toBe(false)
    const mirrored = localPerspective(sensed, true) as FightState
    expect(currentlyLocatedTarget(mirrored)).toEqual({ x: 80, y: 0, at: sensed.frame })
  })
  it('does not locate vanished or destroyed copies and does not inherit the mark that could sustain one', () => {
    let state = roomCopy()
    const id = copies(state)[0].id
    state = locate(state, 'player:room')
    const expired = advanceGallerySenses({ ...state, frame: state.frame + GALLERY_FAKE_LIFETIME })
    expect(expired.player.chrolloHistorical?.galleryReading?.copies).toEqual([])
    const destroyed = advanceGallerySenses(updateEntity(state, id, { health: 0 }))
    expect(destroyed.player.chrolloHistorical?.galleryReading?.copies).toEqual([])
    const marked = updateEntity(state, id, { arena: { width: 6, height: 16, sun: 'player' } })
    const pageLost = {
      ...marked,
      player: { ...marked.player, chrolloBook: { ...marked.player.chrolloBook!, bookmark: null } },
    }
    expect(liveGalleryContacts(pageLost, 'player')).toEqual([])
    expect(advanceGallerySenses(pageLost).player.chrolloHistorical?.galleryFocus).toBeUndefined()
  })
  it('follows a copied device in an actual carrier’s hands', () => {
    let state = copy(ready(), 'player:device:camera')
    const id = copies(state)[0].id
    state = { ...state, opponent: { ...state.opponent, x: 20 } }
    state = performArsenalCommand(state, 'opponent', { action: 'device-pickup', target: id })
    expect(state.battlefield!.entities.find((e) => e.id === id)?.device?.carrier).toBe('opponent')
    state = { ...state, opponent: { ...state.opponent, x: 83 } }
    expect(
      locate(state, 'player:device:camera').player.chrolloHistorical?.galleryReading?.copies[0].x,
    ).toBe(80.5)
  })
  it('keeps a body original tied to the actual team member after a relay', () => {
    const base = beginFight(
      createTeamFight({
        player: ['chrollo', 'basho', 'bill'],
        opponent: ['hisoka', 'machi', 'melody'],
      }),
    )
    let state: FightState = {
      ...base,
      player: {
        ...base.player,
        x: 25,
        chrolloBook: { pages: ['gallery-fake'], page: 0, open: false, bookmark: 'gallery-fake' },
      },
      opponent: { ...base.opponent, x: 30 },
    }
    state = copy(state, 'opponent')
    expect(copies(state)[0].copy?.originalMember).toBe(0)
    state = { ...state, opponent: { ...state.opponent, x: 93 } }
    state = requestTeamAssist(state, 'opponent', 1)
    expect(state.opponent.id).toBe('machi')
    state = { ...state, player: { ...state.player, x: 90 }, opponent: { ...state.opponent, x: 75 } }
    expect(
      locate(state, 'body:opponent:0').player.chrolloHistorical?.galleryFocus?.originalMember,
    ).toBe(0)
    expect(locate(state, 'body:opponent:1')).toBe(state)
  })
  it('does not copy a supporter’s living will, feather, controller or personal room links', () => {
    const base = ready()
    const source = base.battlefield!.entities.find((e) => e.kind === 'supporter')!
    let state = { ...base, player: { ...base.player, x: source.x } }
    state = copy(state, source.id)
    const replica = copies(state)[0]
    expect(replica.kind).toBe('puppet')
    expect(replica.feather).toBeUndefined()
    expect(replica.consenting).toBe(false)
    expect(replica.controller).toBeUndefined()
    const room = copies(roomCopy())[0]
    expect(room.linkedTo).toBeUndefined()
    expect(room.visitedBy).toBeUndefined()
  })
  it('does not turn a fake Morena or seed into a living prerequisite', () => {
    const base = ready()
    const atMorena = { ...base, player: { ...base.player, x: 50 } }
    let state = copy(atMorena, 'neutral:morena')
    state = updateEntity(state, 'neutral:morena', { health: 0 })
    expect(morenaPresent(state)).toBe(false)
    let seed = copy(ready(), 'player:seed')
    seed = updateEntity(seed, 'player:seed', { present: false })
    const body = { ...seed.player, id: 'bill' as const, nenOwner: 'chrollo' as const, x: 20 }
    const borrowed = { ...seed, player: body }
    expect(
      performPreparedAction({
        state: borrowed,
        side: 'player',
        kind: 'special',
        moveId: 'bill:neutralSpecial',
        auraCharged: false,
      }),
    ).toBe(borrowed)
  })
  it('keeps the reading private, supports the AI and stops immediately under On', () => {
    const state = roomCopy()
    const mirrored = localPerspective(state, true) as FightState
    expect(gallerySenseAi(mirrored)?.opponent.chrolloHistorical?.galleryFocus).toBeTruthy()
    const located = locate(state, 'player:room')
    expect(
      privatePvpState(located, 'opponent').opponent.chrolloHistorical?.galleryReading,
    ).toBeUndefined()
    const sealed = {
      ...located,
      player: { ...located.player, nen: { ...located.player.nen, on: true } },
    }
    expect(liveGalleryContacts(sealed, 'player')).toEqual([])
    expect(advanceGallerySenses(sealed).player.chrolloHistorical?.galleryFocus).toBeUndefined()
  })
})
