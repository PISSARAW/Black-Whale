import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createSweetHomeClock } from './sweetHomePresentation'
import { createSweetHomeAnchors } from './sweetHomeAnchors'
import { createSweetHomeAccentScene } from './sweetHomeAccentScene'
import { createPreparationScene } from './preparationScene'
import { createCinematicDirector } from './cinematicDirector'
import { defaultFightComfort } from './fightComfort'
import { otherSide } from './frameData'
import {
  createSweetHomeScenario,
  prepareSweetHomeContact,
  resolveSweetHomeContact,
  type SweetHomeScenario,
} from '../../../ui-tests/fighting-sweet-home/scenarios'
import type { FightSide, FightState } from './types'

function setup() {
  let comfort = defaultFightComfort(),
    viewer: FightSide = 'player'
  const options = {
    THREE,
    scene: new THREE.Scene(),
    worldX: (x: number) => x / 6,
    worldY: (y: number) => y / 6,
    comfort: () => comfort,
    viewer: () => viewer,
  }
  const prepared = createPreparationScene(options),
    effect = createSweetHomeAccentScene(options)
  return {
    options,
    sync(s: FightState, seconds = 0) {
      prepared.sync(s, seconds)
      effect.sync(s, seconds)
    },
    view(side: FightSide) {
      viewer = side
    },
    reduce() {
      comfort = { ...comfort, camera: 0, flashes: false }
    },
    dispose() {
      effect.dispose()
      prepared.dispose()
    },
  }
}
function hit(mode: SweetHomeScenario, owner: FightSide = 'player') {
  const before = createSweetHomeScenario(mode, owner)
  const ready = prepareSweetHomeContact(before, mode, owner)
  return { before, ready, after: resolveSweetHomeContact(ready, mode) }
}

describe('Sweet Home type 1: confirmed absorption and wound transfer', () => {
  for (const owner of ['player', 'opponent'] as const) {
    for (const mode of ['return', 'absorb', 'backlash', 'object', 'external-object'] as const) {
      it(`${owner} / ${mode}: follows the actual injury route without changing damage or opening an inset`, () => {
        const { before, ready, after } = hit(mode, owner)
        const clock = createSweetHomeClock(),
          camera = createCinematicDirector({ viewer: () => owner })
        clock(before)
        camera.update(before)
        expect(clock(ready)).toEqual([])
        expect(camera.update(ready).detail).toBeNull()
        const saved = JSON.stringify(after),
          events = clock(after)
        expect(events).toHaveLength(1)
        expect(events[0].owner).toBe(owner)
        expect(events[0].age).toBe(0)
        expect(events[0].damage).toBeGreaterThan(0)
        expect(camera.update(after).detail).toBeNull()
        expect(JSON.stringify(after)).toBe(saved)
        const external = mode === 'absorb' || mode === 'backlash' || mode === 'external-object'
        expect(events[0].from).toBe(external ? otherSide(owner) : owner)
        if (mode === 'object' || mode === 'external-object') {
          expect(after.impact?.damage).toBe(0)
          expect(events[0].damage).toBe(after.impact!.objectTransfer!.damage)
          expect(events[0].recipient).toMatchObject({ kind: 'object', id: `${owner}:crate` })
          const box = after.battlefield!.entities.find((e) => e.id === `${owner}:crate`)!
          expect(box.health).toBe(100 - events[0].damage)
          expect(after[owner].health).toBe(before[owner].health)
          expect(after[otherSide(owner)].health).toBe(before[otherSide(owner)].health)
        } else {
          const recipient = external ? owner : otherSide(owner)
          expect(events[0].recipient).toEqual({ kind: 'body', side: recipient })
          expect(events[0].backlash).toBe(mode === 'backlash')
          expect(after[recipient].health).toBe(before[recipient].health - events[0].damage)
          expect(after[events[0].from].health).toBe(before[events[0].from].health)
        }
      })
    }
  }
  for (const mode of ['stance', 'no-contact', 'broken-object'] as const) {
    it(`${mode}: a gesture, failed hand contact or destroyed recipient creates no wound route`, () => {
      const { before, ready, after } = hit(mode)
      const clock = createSweetHomeClock()
      clock(before)
      clock(ready)
      expect(clock(after)).toEqual([])
      expect(after.impact?.transfer).toBeUndefined()
      expect(after.impact?.objectTransfer).toBeUndefined()
      if (mode !== 'stance') expect(after.player.health).toBeLessThan(before.player.health)
    })
  }
  it('does not replay the same impact, a cold reconstruction, a new round or a rewind', () => {
    const { before, after } = hit('return'),
      clock = createSweetHomeClock()
    clock(before)
    const first = clock(after)
    expect(clock(structuredClone(after))).toEqual(first)
    expect(createSweetHomeClock()(after)).toEqual([])
    expect(clock({ ...after, frame: after.frame + 17 })[0].age).toBe(17)
    expect(clock({ ...after, frame: after.frame + 18 })).toEqual([])
    expect(clock(after)).toEqual([])
    expect(clock({ ...after, roundNumber: after.roundNumber + 1 })).toEqual([])
    expect(clock({ ...after, phase: 'finished' })).toEqual([])
  })
  it('never depicts a parried or avoided contact as absorption', () => {
    const { before, after } = hit('return'),
      clock = createSweetHomeClock()
    clock(before)
    expect(clock({ ...after, impact: { ...after.impact!, avoided: true } })).toEqual([])
  })
  it('routes an external wound through right then left, and a personal wound through the left alone', () => {
    const options = setup().options
    const anchors = createSweetHomeAnchors(options)
    for (const mode of ['return', 'absorb', 'backlash'] as const) {
      const { before, after } = hit(mode),
        clock = createSweetHomeClock()
      clock(before)
      const event = clock(after)[0],
        path = anchors.path(after, event)
      expect(path.points).toHaveLength(mode === 'return' ? 3 : 4)
      if (mode !== 'return') expect(path.points[1]).toBe(path.right)
      expect(path.points.at(-2)).toBe(path.left)
      if (mode === 'backlash') expect(path.points.at(-1)!.toArray()).toEqual(path.left.toArray())
    }
  })
  it('uses the live anatomical hands across facing changes and rig rebuilds, with stable pause anchors', () => {
    const { before, after } = hit('absorb')
    let figure = new THREE.Group()
    function rig() {
      for (const [name, x] of [
        ['hand-right', 2],
        ['hand-left', -2],
        ['torso', 0],
      ] as const) {
        const joint = new THREE.Group()
        joint.name = name
        joint.position.set(x, 1, 0)
        figure.add(joint)
      }
    }
    rig()
    const options = {
      THREE,
      scene: new THREE.Scene(),
      worldX: (x: number) => x / 6,
      worldY: (y: number) => y / 6,
      figureOf: () => figure,
    }
    const anchors = createSweetHomeAnchors(options),
      clock = createSweetHomeClock()
    clock(before)
    const event = clock(after)[0],
      first = anchors.path(after, event)
    expect(first.right.x).toBe(2)
    expect(first.left.x).toBe(-2)
    figure.getObjectByName('hand-right')!.position.x = 8
    expect(anchors.path(after, event)).toBe(first)
    figure = new THREE.Group()
    rig()
    figure.position.x = 3
    expect(anchors.path(after, event).right.x).toBe(5)
    const flipped = { ...after, player: { ...after.player, facing: -1 as const } }
    expect(anchors.path(flipped, event).right.x).toBe(5)
  })
  it('keeps actual consequences visible while In/Gyo, comfort and pause filter only the ornaments', () => {
    const scene = setup(),
      { before, after } = hit('external-object', 'opponent')
    scene.sync(before)
    scene.sync(after)
    const root = scene.options.scene.getObjectByName('sweet-home-type-one')!,
      route = root.children[0]
    const positions = route.children.map((n) => n.position.toArray())
    scene.sync(after, 999)
    expect(route.children.map((n) => n.position.toArray())).toEqual(positions)
    const concealed = {
      ...after,
      opponent: { ...after.opponent, nen: { ...after.opponent.nen, in: true } },
    }
    scene.sync(concealed)
    expect(route.visible).toBe(false)
    const box = scene.options.scene.getObjectByName('prepared:opponent:crate')!
    expect(box.visible).toBe(true)
    const seen = {
      ...concealed,
      player: { ...concealed.player, nen: { ...concealed.player.nen, gyo: true } },
    }
    scene.sync(seen)
    expect(route.visible).toBe(true)
    scene.view('opponent')
    scene.sync(concealed)
    expect(route.visible).toBe(true)
    scene.reduce()
    scene.sync(concealed)
    expect(root.visible).toBe(false)
    expect(box.visible).toBe(true)
    const line = route.children.find((n) => n instanceof THREE.Line) as THREE.Line
    const dispose = vi.spyOn(line.geometry, 'dispose')
    scene.dispose()
    expect(dispose).toHaveBeenCalledTimes(1)
    expect(scene.options.scene.children).toHaveLength(0)
  })
})
