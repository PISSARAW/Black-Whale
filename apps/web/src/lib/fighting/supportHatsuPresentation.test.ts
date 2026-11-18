import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { advanceCookie, COOKIE_PIANO_FRAMES } from './cookie'
import { withDolphinIdentity } from './kurapikaDolphin'
import { performBiscuitFormAction } from './biscuitFormAction'
import { createSupportHatsuClock } from './supportHatsuPresentation'
import { createSupportHatsuScene } from './supportHatsuScene'
import { createPreparationScene } from './preparationScene'
import { createCinematicDirector } from './cinematicDirector'
import { defaultFightComfort } from './fightComfort'
import { BIRD_WINGS, BIRD_TETHER } from '$lib/tour/apparitionBasicView'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from './types'

function duel(
  id: FighterId,
  side: FightSide = 'player',
  resources: ('plants' | 'birds')[] = [],
): FightState {
  const s = beginFight(
    createFight(side === 'player' ? id : 'hisoka', side === 'opponent' ? id : 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: { mode: resources.length ? 'scenario' : 'duel', resources, cohorts: [] },
      },
    }),
  )
  return {
    ...s,
    player: { ...s.player, x: resources.length ? 25 : 44, aura: 100 },
    opponent: { ...s.opponent, x: resources.length ? 75 : 49, aura: 100 },
  }
}
function frames(s: FightState, n: number, watch: (s: FightState) => void = () => {}) {
  for (let i = 0; i < n; i++) {
    s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    watch(s)
  }
  return s
}
function setup() {
  let comfort = defaultFightComfort(),
    viewer: FightSide = 'player'
  const options = {
    THREE,
    scene: new THREE.Scene(),
    worldX: (x: number) => x / 6,
    worldY: (y: number) => y / 6,
    viewer: () => viewer,
    comfort: () => comfort,
  }
  const prepared = createPreparationScene(options),
    support = createSupportHatsuScene(options)
  return {
    options,
    sync(s: FightState, seconds = 0) {
      prepared.sync(s, seconds)
      support.sync(s, seconds)
    },
    dispose() {
      support.dispose()
      prepared.dispose()
    },
    view(side: FightSide) {
      viewer = side
    },
    reduce() {
      comfort = { ...comfort, camera: 0, flashes: false }
    },
  }
}

describe('Bill, Cluck and Cookie: confirmed support in type 1', () => {
  for (const side of ['player', 'opponent'] as const) {
    it(`Bill ${side}: unfolds only a real germinated seed, without changing the simulation`, () => {
      const scene = setup(),
        clock = createSupportHatsuClock(),
        camera = createCinematicDirector({ viewer: () => side })
      let s = duel('bill', side, ['plants'])
      scene.sync(s)
      clock(s)
      camera.update(s)
      const before = s
      s = performAttack(s, side, 'special')
      expect(s[side].health).toBe(before[side].health)
      expect(s[side].attack).toBeNull()
      expect(clock(s)).toMatchObject([
        { source: 'bill', kind: 'growth', owner: side, subject: `${side}:seed`, age: 0 },
      ])
      expect(camera.update(s).detail).toBeNull()
      const unchanged = JSON.stringify(s)
      scene.sync(s)
      const plant = scene.options.scene
        .getObjectByName(`prepared:${side}:seed`)!
        .getObjectByName('growth')!
      expect(plant.scale.y).toBeCloseTo(0.05)
      scene.sync(s, 999)
      expect(plant.scale.y).toBeCloseTo(0.05)
      expect(JSON.stringify(s)).toBe(unchanged)
      s = frames(s, 9)
      scene.sync(s)
      expect(plant.scale.y).toBeGreaterThan(0.4)
      s = frames(s, 10)
      scene.sync(s)
      expect(plant.scale.toArray()).toEqual([1, 1, 1])
      expect(clock(s)).toEqual([])
      scene.dispose()
      expect(scene.options.scene.children).toHaveLength(0)
    })
    it(`Cluck ${side}: tracks a real bird to confirmed delivery without a camera inset`, () => {
      let s = duel('cluck', side, ['birds'])
      const clock = createSupportHatsuClock(),
        camera = createCinematicDirector({ viewer: () => side })
      clock(s)
      camera.update(s)
      const health = s[side === 'player' ? 'opponent' : 'player'].health
      s = performAttack(s, side, 'special')
      expect(clock(s)).toMatchObject([{ kind: 'dispatch', owner: side, subject: `${side}:bird` }])
      expect(camera.update(s).detail).toBeNull()
      const kinds = new Set<string>()
      s = frames(s, 160, (next) => {
        clock(next).forEach((e) => kinds.add(e.kind))
        expect(camera.update(next).detail).toBeNull()
      })
      expect(kinds.has('delivery')).toBe(true)
      expect(s.battlefield!.entities.find((e) => e.id === `${side}:bird`)!.delivered).toBe(true)
      expect(s[side === 'player' ? 'opponent' : 'player'].health).toBe(health)
      expect(s.projectiles).toHaveLength(0)
    })
    it(`Cookie ${side}: starts a consenting treatment and accents actual relief without healing wounds`, () => {
      let s = duel('biscuit', side)
      const other = side === 'player' ? 'opponent' : 'player'
      s = { ...s, [other]: { ...s[other], aura: 40, health: 50, supportConsent: true } }
      const clock = createSupportHatsuClock()
      clock(s)
      s = performArsenalCommand(s, side, { action: 'cookie-massage', target: other })
      expect(clock(s)).toMatchObject([{ kind: 'treatment', owner: side, subject: other }])
      const body = s[side].biscuitTrueForm
      for (let i = 0; i < 60; i++) {
        s = advanceCookie({ ...s, frame: s.frame + 1 })
        clock(s)
      }
      expect(clock(s)).toMatchObject([{ kind: 'relief', owner: side, subject: other }])
      expect(s[other].aura).toBe(41)
      expect(s[other].health).toBe(50)
      expect(s[side].biscuitTrueForm).toBe(body)
      s = advanceCookie({ ...s, [other]: { ...s[other], supportConsent: false } })
      expect(s[side].cookie).toBeUndefined()
      expect(clock(s)).toEqual([])
    })
  }
  it('keeps confirmed borrowed Erigeron in type 1 after the execution identity restores Kurapika', () => {
    let s = duel('kurapika', 'player', ['plants'])
    s = {
      ...s,
      player: {
        ...s.player,
        kurapika: {
          ...s.player.kurapika!,
          emperorTime: true,
          held: {
            source: 'bill',
            victim: 'opponent',
            moveId: 'bill:neutralSpecial',
            loaded: true,
            used: true,
            sustainedKeys: [],
          },
        },
      },
    }
    const clock = createSupportHatsuClock()
    clock(s)
    expect(clock(s)).toEqual([])
    s = withDolphinIdentity(s, (borrowed) => performAttack(borrowed, 'player', 'special'))
    expect(s.player.id).toBe('kurapika')
    expect(s.battlefield!.entities.find((e) => e.id === 'player:seed')!.growth).toBe(1)
    expect(clock(s)).toMatchObject([{ kind: 'growth', owner: 'player' }])
  })
  it('preserves the separate camera for Biscuit’s actual body transformation', () => {
    const initial = duel('biscuit'),
      camera = createCinematicDirector(),
      clock = createSupportHatsuClock()
    camera.update(initial)
    clock(initial)
    const revealed = performBiscuitFormAction({
      state: initial,
      side: 'player',
      kind: 'special',
      moveId: 'biscuit:neutralSpecial',
    })!
    expect(revealed.player.biscuitTrueForm).toBe(true)
    expect(clock(revealed)).toEqual([])
    expect(camera.update(revealed).detail?.eventId).toBe('biscuit.form')
  })
  it('creates no growth, bird or Cookie when prerequisites are missing', () => {
    for (const id of ['bill', 'cluck', 'biscuit'] as const) {
      const s = duel(id),
        clock = createSupportHatsuClock()
      clock(s)
      const next =
        id === 'biscuit'
          ? performArsenalCommand(s, 'player', { action: 'cookie-massage', target: 'opponent' })
          : performAttack(s, 'player', 'special')
      expect(clock(next)).toEqual([])
      expect(next.player.cookie).toBeUndefined()
      expect(
        next.battlefield!.entities.filter((e) => e.kind === 'bird' || e.kind === 'seed'),
      ).toEqual([])
    }
  })
  it('does not replay support on cold reconstruction, a rewind, a new round or outside fighting', () => {
    const clock = createSupportHatsuClock(),
      fresh = duel('bill', 'player', ['plants'])
    clock(fresh)
    const grown = performAttack(fresh, 'player', 'special')
    expect(clock(grown)).toHaveLength(1)
    expect(createSupportHatsuClock()(grown)).toEqual([])
    expect(clock({ ...grown, frame: 10 })).toHaveLength(1)
    expect(clock(grown)).toEqual([])
    expect(clock({ ...grown, roundNumber: grown.roundNumber + 1 })).toEqual([])
    expect(clock({ ...grown, phase: 'finished' })).toEqual([])
  })
  it('does not mistake release of the pigeon for a successful delivery', () => {
    const clock = createSupportHatsuClock()
    let s = duel('cluck', 'player', ['birds'])
    clock(s)
    s = performAttack(s, 'player', 'special')
    clock(s)
    s = frames(s, 20, (n) => clock(n))
    s = performAttack(s, 'player', 'special')
    expect(clock(s)).toEqual([])
    expect(s.battlefield!.entities.find((e) => e.id === 'player:bird')!.delivered).toBe(false)
  })
  it('signals Piano recovery only after the actual thirty-minute threshold', () => {
    let s = performArsenalCommand(duel('biscuit'), 'player', { action: 'cookie-piano' })
    s = {
      ...s,
      player: { ...s.player, cookie: { ...s.player.cookie!, frames: COOKIE_PIANO_FRAMES - 2 } },
    }
    const clock = createSupportHatsuClock()
    clock(s)
    s = advanceCookie({ ...s, frame: s.frame + 1 })
    expect(clock(s)).toEqual([])
    s = advanceCookie({ ...s, frame: s.frame + 1 })
    expect(clock(s)).toMatchObject([{ kind: 'rest', subject: 'player' }])
    expect(s.player.aura).toBe(100)
    expect(s.player.arsenalSleep).toBeUndefined()
  })
  it('animates both real wings, respects the selected viewer’s Gyo, pauses and releases resources', () => {
    const scene = setup()
    let s = duel('cluck', 'opponent', ['birds'])
    scene.sync(s)
    s = frames(performAttack(s, 'opponent', 'special'), 4)
    scene.sync(s)
    const bird = scene.options.scene.getObjectByName('prepared:opponent:bird')!
    const wings = bird.getObjectByName(BIRD_WINGS)!,
      tether = bird.getObjectByName(BIRD_TETHER)!
    expect(wings.children).toHaveLength(2)
    expect(wings.children[0].rotation.z).toBe(-wings.children[1].rotation.z)
    const rotation = wings.children.map((n) => n.rotation.z)
    scene.sync(s, 999)
    expect(wings.children.map((n) => n.rotation.z)).toEqual(rotation)
    expect(tether.visible).toBe(false)
    s = { ...s, opponent: { ...s.opponent, nen: { ...s.opponent.nen, gyo: true } } }
    scene.sync(s)
    expect(tether.visible).toBe(false)
    scene.view('opponent')
    scene.sync(s)
    expect(tether.visible).toBe(true)
    scene.reduce()
    scene.sync(s)
    expect(wings.children.map((n) => Math.abs(n.rotation.z))).toEqual([0, 0])
    expect(bird.visible).toBe(true)
    const line = tether as THREE.Line
    const disposed = vi.spyOn(line.geometry, 'dispose')
    scene.dispose()
    expect(disposed).toHaveBeenCalledTimes(1)
    expect(scene.options.scene.children).toHaveLength(0)
  })
  it('keeps Cookie separate from Biscuit, hides concealed Nen, freezes hands, and removes her on interruption', () => {
    const scene = setup()
    let s = duel('biscuit', 'opponent')
    scene.sync(s)
    s = performArsenalCommand(s, 'opponent', { action: 'cookie-piano' })
    scene.sync(s)
    const cookie = scene.options.scene.getObjectByName('cookie-treatment:opponent')!
    const arm = cookie.getObjectByName('cookie-shoulder:1')!
    const pose = arm.quaternion.toArray()
    scene.sync(s, 1000)
    expect(arm.quaternion.toArray()).toEqual(pose)
    s = frames(s, 8)
    scene.sync(s)
    expect(arm.quaternion.toArray()).not.toEqual(pose)
    s = { ...s, opponent: { ...s.opponent, nen: { ...s.opponent.nen, in: true } } }
    scene.sync(s)
    expect(cookie.visible).toBe(false)
    s = { ...s, player: { ...s.player, nen: { ...s.player.nen, gyo: true } } }
    scene.sync(s)
    expect(cookie.visible).toBe(true)
    scene.reduce()
    scene.sync(s)
    expect(scene.options.scene.getObjectByName('support-type-one')!.visible).toBe(false)
    expect(cookie.visible).toBe(true)
    s = advanceCookie({
      ...s,
      opponent: { ...s.opponent, hatsuEffects: { ...s.opponent.hatsuEffects, hatsuStolen: 1 } },
    })
    scene.sync(s)
    expect(cookie.visible).toBe(false)
    scene.dispose()
    expect(scene.options.scene.children).toHaveLength(0)
  })
})
