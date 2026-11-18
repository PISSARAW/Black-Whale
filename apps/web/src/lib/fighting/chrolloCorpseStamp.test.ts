import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { corpseSetup, corpseEntry } from './illumiCorpseTestSetup'
import { performArsenalCommand, arsenalOptions } from './retrospectiveArsenal'
import { mapFrames } from './dowsingMapTestSetup'
import { advanceHistoricalCopies } from './chrolloHistoricalObjects'
import { damageArenaObject } from './arenaSimulation'
import { createPreparationScene } from './preparationScene'
import { corpseCollider } from './preparedCorpseBody'
import { corpseUpright } from './corpsePose'
import { privatePvpState } from './pvp/view'
import { expireHistoricalMatter } from './historicalMatterClock'
import { GALLERY_FAKE_LIFETIME } from './historicalCopyLifetime'
import type { FightSide, FightState } from './types'

function setup(side: FightSide = 'player'): FightState {
  const base = corpseSetup(side, 'chrollo')
  return {
    ...base,
    [side]: {
      ...base[side],
      chrolloBook: {
        pages: ['gallery-fake', 'order-stamp'],
        page: 0,
        open: false,
        bookmark: 'gallery-fake',
      },
    },
  }
}
function copied(side: FightSide = 'player'): FightState {
  const state = performArsenalCommand(setup(side), side, {
    action: 'history-use',
    target: `${side}:corpse`,
  })
  return mapFrames(state, 19)
}
function stampPage(state: FightState, side: FightSide = 'player'): FightState {
  return mapFrames(
    performArsenalCommand(state, side, { action: 'history-page', target: 'order-stamp' }),
    13,
  )
}
function replica(state: FightState) {
  return state.battlefield!.entities.find((entry) => entry.copy?.originalKind === 'corpse')!
}
describe('Order Stamp animates a corpse copy without admitting the real dead body', () => {
  it.each<FightSide>(['player', 'opponent'])('executes the chapter 352 path for %s', (side) => {
    const state = stampPage(copied(side), side)
    const copy = replica(state)
    expect(copy.material).toBe('nen')
    expect(copy.kind).toBe('corpse')
    expect(copy.copy?.order).toBeUndefined()
    expect(copy.arena?.height).toBe(3)
    expect(
      performArsenalCommand(state, side, { action: 'history-use', target: `${side}:corpse` }),
    ).toBe(state)
    expect(
      arsenalOptions(state, side).find(
        (option) => option.labelEn === 'Order Stamp · Stamp a puppet',
      )?.ready,
    ).toBe(true)
    const marked = performArsenalCommand(state, side, { action: 'history-use', target: copy.id })
    expect(replica(marked).copy).toMatchObject({ owner: side, order: 'attack', headAttached: true })
    expect(replica(marked).arena?.height).toBe(12)
    expect(marked[side].aura).toBe(state[side].aura - 10)
    expect(corpseEntry(marked, `${side}:corpse`).controller).toBeUndefined()
    expect(corpseEntry(marked, `${side}:corpse`).corpseNeedles).toBeUndefined()
    const moving = advanceHistoricalCopies(marked)
    expect(replica(moving).x).not.toBe(copy.x)
    const waiting = performArsenalCommand(mapFrames(marked, 19), side, {
      action: 'history-order-wait',
    })
    expect(replica(waiting).copy?.order).toBe('wait')
    expect(replica(advanceHistoricalCopies(waiting)).x).toBe(replica(waiting).x)
    expect(corpseUpright(replica(waiting))).toBe(true)
  })
  it('requires a free hand, speech, real contact and an attached head', () => {
    const state = stampPage(copied())
    const id = replica(state).id
    const command = { action: 'history-use' as const, target: id }
    const distant = { ...state, player: { ...state.player, x: 90 } }
    expect(performArsenalCommand(distant, 'player', command)).toBe(distant)
    const aboveHead = { ...state, player: { ...state.player, y: 5 } }
    expect(performArsenalCommand(aboveHead, 'player', command)).toBe(aboveHead)
    const noHands = { ...state, player: { ...state.player, coveringEars: true } }
    expect(performArsenalCommand(noHands, 'player', command)).toBe(noHands)
    const mute = {
      ...state,
      player: { ...state.player, hatsuEffects: { ...state.player.hatsuEffects, senseSeals: 4 } },
    }
    expect(performArsenalCommand(mute, 'player', command)).toBe(mute)
    const headless = damageArenaObject(state, id, { damage: 16, zone: 'head' })
    expect(performArsenalCommand(headless, 'player', command)).toBe(headless)
    const marked = performArsenalCommand(state, 'player', command)
    const severed = damageArenaObject(marked, id, { damage: 16, zone: 'head' })
    expect(corpseUpright(replica(severed))).toBe(false)
    expect(corpseCollider(replica(severed)).arena?.height).toBe(3)
    expect(replica(advanceHistoricalCopies(severed)).x).toBe(replica(severed).x)
  })
  it('predicts the same canonical corpse copy and order from the P2 view', () => {
    const state = stampPage(copied('opponent'), 'opponent')
    const command = { action: 'history-use' as const, target: replica(state).id }
    const actual = performArsenalCommand(state, 'opponent', command)
    const local = performArsenalCommand(privatePvpState(state, 'opponent'), 'player', command)
    expect(replica(local)).toEqual(replica(privatePvpState(actual, 'opponent')))
    expect(replica(local).copy?.order).toBe('attack')
  })
  it('retains the ordinary Gallery Fake lifetime and does not turn a stamp into a post-mortem mark', () => {
    const state = stampPage(copied())
    const marked = performArsenalCommand(state, 'player', {
      action: 'history-use',
      target: replica(state).id,
    })
    const expired = expireHistoricalMatter({
      ...marked,
      frame: replica(marked).copy!.createdAt + GALLERY_FAKE_LIFETIME,
      hitstop: 5,
    })
    expect(replica(expired).present).toBe(false)
    expect(corpseEntry(expired).present).toBe(true)
    const released = expireHistoricalMatter({
      ...marked,
      player: { ...marked.player, chrolloBook: { ...marked.player.chrolloBook!, bookmark: null } },
    })
    expect(replica(released).present).toBe(false)
    expect(corpseEntry(released)).toEqual(corpseEntry(marked))
  })
  it('keeps a cached human body and shows no Illumi needles when the copy stands', () => {
    const scene = new THREE.Scene()
    const visual = createPreparationScene({
      THREE,
      scene,
      worldX: (x) => x * 0.12,
      worldY: (y) => y * 0.12,
    })
    const state = stampPage(copied())
    visual.sync(state, 0)
    const id = replica(state).id
    const root = scene.getObjectByName(`prepared:${id}`)!
    expect(root.rotation.z).toBeCloseTo(Math.PI / 2)
    const marked = performArsenalCommand(state, 'player', { action: 'history-use', target: id })
    visual.sync(marked, 0)
    expect(scene.getObjectByName(root.name)).toBe(root)
    expect(Math.abs(root.rotation.z)).toBeLessThanOrEqual(0.025)
    const imprint = root.getObjectByName('order-stamp-imprint')!
    expect(imprint.visible).toBe(true)
    expect(imprint.parent).toBe(root.getObjectByName('face-mouth')?.parent)
    expect(root.getObjectByName('corpse-control-needles')?.visible).toBe(false)
    visual.dispose()
  })
})
