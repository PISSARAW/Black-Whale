import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createPhinksAnimationClock } from './phinksAnimationClock'
import { createPhinksAccentScene } from './phinksAccentScene'
import { createPhinksAnchors } from './phinksAnchors'
import { createCinematicDirector } from './cinematicDirector'
import { PHINKS_IMPACT_EVENT, phinksChargedHit, phinksAttackSnapshot } from './phinksAnimation'
import { phinksCameraEvent } from './phinksCameraPresentation'
import { cameraSnapshot } from './cinematicSnapshot'
import { cinematicEvents } from './cinematicEvents'
import { performAttack, performMove, createFight } from './engine'
import { resolveFightImpacts } from './combatImpact'
import { attackData, otherSide } from './frameData'
import { encodeReplay, decodeReplay } from './clashReplayCodec'
import { defaultFightComfort } from './fightComfort'
import {
  actPhinks,
  advancePhinks,
  createPhinksScenario,
} from '../../../ui-tests/fighting-phinks-cinematics/scenarios'
import type { PhinksScenario } from '../../../ui-tests/fighting-phinks-cinematics/scenarios'
import type { FightSide, FightState } from './types'

function contact(owner: FightSide = 'player', mode: PhinksScenario = 'hit') {
  const before = createPhinksScenario(mode, owner),
    ready = actPhinks(before, mode, owner)
  let after = ready
  for (let i = 0; i < 30 && !after.cyclotronContacts?.[owner]; i++)
    after = advancePhinks(after, 1, mode)
  return { before, ready, after }
}
function active(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  return {
    ...state,
    [side]: {
      ...fighter,
      attack: { ...fighter.attack!, frame: attackData(fighter.attack!.kind, fighter).startup },
    },
  }
}

describe('Phinks: complete rotations type 1 and confirmed charged contact type 2', () => {
  it.each(['player', 'opponent'] as const)(
    '%s: emits once per actual complete rotation and never during a partial turn',
    (side) => {
      const clock = createPhinksAnimationClock(),
        camera = createCinematicDirector()
      let state = createPhinksScenario('rotations', side)
      clock(state)
      camera.update(state)
      state = actPhinks(state, 'rotations', side)
      expect(clock(state)).toEqual([])
      expect(camera.update(state).detail).toBeNull()
      const seen = new Set<string>()
      for (let i = 1; i <= 144; i++) {
        state = advancePhinks(state, 1, 'rotations')
        for (const e of clock(state)) {
          expect(e.kind).toBe('turn')
          expect(e.turns).toBeLessThanOrEqual(Math.floor(i / 36))
          seen.add(e.id)
        }
        expect(camera.update(state).detail).toBeNull()
      }
      expect(seen.size).toBe(4)
      expect(state[side].hatsuEffects.cyclotronTurns).toBe(4)
      const stopped = performAttack(state, side, 'special')
      expect(clock({ ...stopped, frame: state.frame + 18 })).toEqual([])
    },
  )
  for (const side of ['player', 'opponent'] as const) {
    for (const pacing of ['compact', 'extended'] as const) {
      it(`${side}/${pacing}: starts a 1.4s shot on contact, follows anatomical right hand and actual target, preserves damage`, () => {
        const { before, ready, after } = contact(side)
        const camera = createCinematicDirector({ viewer: () => side, pacing }),
          clock = createPhinksAnimationClock()
        camera.update(before)
        clock(before)
        expect(camera.update(ready).detail).toBeNull()
        expect(clock(ready)).toEqual([])
        const saved = encodeReplay(after),
          result = camera.update(after),
          events = clock(after)
        expect(result.detail).toMatchObject({
          eventId: PHINKS_IMPACT_EVENT,
          side,
          source: 'phinks',
          anchors: [
            { type: 'rig', side, part: 'right-hand' },
            { type: 'rig', side: otherSide(side), part: 'chest' },
          ],
        })
        expect(events).toHaveLength(1)
        expect(events[0]).toMatchObject({ kind: 'impact', owner: side, turns: 3 })
        expect(after[otherSide(side)].health).toBe(
          before[otherSide(side)].health - after.cyclotronContacts![side]!.damage,
        )
        expect(after[side].hatsuEffects.cyclotronTurns).toBe(0)
        expect(encodeReplay(after)).toBe(saved)
        expect(camera.update(structuredClone(after))).toEqual(result)
        expect(camera.update({ ...after, frame: after.frame + 83 }).detail?.eventId).toBe(
          PHINKS_IMPACT_EVENT,
        )
        expect(camera.update({ ...after, frame: after.frame + 84 }).detail).toBeNull()
      })
    }
  }
  it('also confirms a punch after just one completed turn', () => {
    const { before, after } = contact('player', 'one-turn'),
      clock = createPhinksAnimationClock()
    clock(before)
    expect(clock(after)[0]).toMatchObject({ kind: 'impact', turns: 1 })
  })
  it.each(['block', 'miss', 'interrupted', 'partial', 'ordinary'] as const)(
    '%s: creates no charged-impact shot or contact accent',
    (mode) => {
      const before = createPhinksScenario(mode),
        camera = createCinematicDirector(),
        clock = createPhinksAnimationClock()
      camera.update(before)
      clock(before)
      let state = actPhinks(before, mode, 'player')
      for (let i = 0; i < 100; i++) {
        expect(clock(state).some((e) => e.kind === 'impact')).toBe(false)
        expect(camera.update(state).detail?.eventId).not.toBe(PHINKS_IMPACT_EVENT)
        state = advancePhinks(state, 1, mode)
      }
      expect(state.cyclotronContacts).toBeUndefined()
      if (mode === 'ordinary') expect(state.player.hatsuEffects.cyclotronTurns).toBe(3)
      if (mode === 'block') expect(state.impact?.blocked).toBe(true)
      if (mode === 'interrupted') expect(state.player.health).toBeLessThan(before.player.health)
    },
  )
  it.each(['player', 'opponent'] as const)(
    '%s: keeps the outgoing contact through a simultaneous counter hit that erases both attacks',
    (owner) => {
      const before = createPhinksScenario('hit', owner),
        target = otherSide(owner)
      let ready = actPhinks(before, 'hit', owner)
      ready = performAttack(ready, target, 'light')
      ready = active(active(ready, owner), target)
      const after = resolveFightImpacts(ready, []),
        clock = createPhinksAnimationClock()
      clock(ready)
      expect(after.player.attack).toBeNull()
      expect(after.opponent.attack).toBeNull()
      expect(after[owner].health).toBeLessThan(before[owner].health)
      expect(after[target].health).toBeLessThan(before[target].health)
      expect(clock(after)).toHaveLength(1)
      expect(clock(after)[0]).toMatchObject({ kind: 'impact', owner })
    },
  )
  it('keeps both confirmed charged punches in a Phinks mirror trade', () => {
    const base = createPhinksScenario('hit')
    const second = createPhinksScenario('hit', 'opponent').opponent
    let ready = { ...base, opponent: { ...second, x: 48 } }
    ready = performMove({ state: ready, side: 'player', action: 'finisher' })
    ready = performMove({ state: ready, side: 'opponent', action: 'finisher' })
    ready = active(active(ready, 'player'), 'opponent')
    const after = resolveFightImpacts(ready, []),
      clock = createPhinksAnimationClock()
    clock(ready)
    expect(
      clock(after)
        .map((e) => e.owner)
        .sort(),
    ).toEqual(['opponent', 'player'])
  })
  it('supports a charged punch borrowed by Chrollo', () => {
    const base = createPhinksScenario('hit')
    const copied = {
      ...base,
      player: {
        ...createFight('chrollo', 'hisoka').player,
        x: 42,
        aura: 100,
        hatsuEffects: { ...base.player.hatsuEffects, cyclotronTurns: 3 },
        chrolloBook: { pages: ['phinks'] as const, page: 0, open: true, bookmark: null },
      },
    }
    const ready = active(performAttack(copied, 'player', 'special'), 'player')
    const after = resolveFightImpacts(ready, []),
      clock = createPhinksAnimationClock()
    clock(ready)
    expect(clock(after)[0]).toMatchObject({ kind: 'impact', owner: 'player', turns: 3 })
  })
  it('preserves exact contact evidence through replay roundtrips and a later unrelated impact', () => {
    const { before, after } = contact(),
      clock = createPhinksAnimationClock(),
      camera = createCinematicDirector()
    const replay = decodeReplay(encodeReplay(after)) as FightState
    replay.impact = {
      ...after.impact!,
      attacker: 'opponent',
      kind: 'ranged',
      projectileId: 99,
      sequence: 99,
    }
    clock(before)
    camera.update(before)
    expect(clock(replay)[0]).toMatchObject({ owner: 'player', turns: 3 })
    expect(camera.update(replay).detail?.eventId).toBe(PHINKS_IMPACT_EVENT)
    expect(clock(structuredClone(replay))).toHaveLength(1)
    expect(createPhinksAnimationClock()(replay)).toEqual([])
    expect(createCinematicDirector().update(replay).detail).toBeNull()
    expect(clock({ ...replay, frame: replay.frame + 24 })).toEqual([])
    expect(clock(replay)).toEqual([])
    expect(clock({ ...replay, roundNumber: replay.roundNumber + 1 })).toEqual([])
  })
  it.each([
    { blocked: true },
    { parried: true },
    { avoided: true },
    { invulnerable: true },
    { damage: 0 },
    { projectileId: 9 },
    { transfer: { owner: 'opponent' } },
  ])('legacy detection rejects failed or rerouted wounds: %j', (patch) => {
    const { ready, after } = contact()
    const state = { ...after, impact: { ...after.impact!, ...patch } } as FightState
    expect(
      phinksChargedHit(state, {
        impact: ready.impact?.sequence,
        actors: [phinksAttackSnapshot(ready.player), phinksAttackSnapshot(ready.opponent)],
      }),
    ).toBeNull()
  })
  it('respects concealed contact ownership and Gyo without revealing a charge count', () => {
    const { before, after } = contact('opponent')
    const event = cinematicEvents(after, cameraSnapshot(before), cameraSnapshot(after)).find(
      (e) => e.detail?.eventId === PHINKS_IMPACT_EVENT,
    )!
    after.cyclotronContacts!.opponent!.concealed = true
    expect(phinksCameraEvent(event, { state: after, viewer: 'player' }).detail).toBeUndefined()
    expect(phinksCameraEvent(event, { state: after, viewer: 'opponent' }).detail?.eventId).toBe(
      PHINKS_IMPACT_EVENT,
    )
    after.player.nen = { ...after.player.nen, gyo: true }
    expect(phinksCameraEvent(event, { state: after, viewer: 'player' }).detail?.eventId).toBe(
      PHINKS_IMPACT_EVENT,
    )
    expect(event.detail?.labelFr).not.toMatch(/3|tour/)
  })
  it('uses anatomical right-hand anchors and freezes active accents in pause, replacing rigs safely', () => {
    const { before, after } = contact(),
      clock = createPhinksAnimationClock()
    clock(before)
    const event = clock(after)[0]
    let figure = new THREE.Group()
    const right = new THREE.Group()
    right.name = 'hand-right'
    right.position.x = 2
    figure.add(right)
    const options = {
      THREE,
      scene: new THREE.Scene(),
      worldX: (x: number) => x / 6,
      worldY: (y: number) => y / 6,
      figureOf: () => figure,
    }
    const anchors = createPhinksAnchors(options),
      path = anchors.path(after, event)
    expect(path.right.x).toBe(2)
    right.position.x = 8
    expect(anchors.path(after, event)).toBe(path)
    figure = new THREE.Group()
    figure.add(right)
    expect(anchors.path(after, event).right.x).toBe(8)
    let comfort = defaultFightComfort()
    const scene = createPhinksAccentScene({ ...options, comfort: () => comfort })
    scene.sync(before, 0)
    scene.sync(after, 0)
    const root = options.scene.getObjectByName('phinks-hatsu-effects')!,
      ring = root.children[0].children[0] as THREE.Mesh
    const poses = root.children[0].children.map((n) => n.position.toArray())
    scene.sync(after, 999)
    expect(root.children[0].children.map((n) => n.position.toArray())).toEqual(poses)
    comfort = { ...comfort, camera: 0, flashes: false }
    scene.sync(after, 999)
    expect(root.visible).toBe(false)
    const dispose = vi.spyOn(ring.geometry, 'dispose')
    scene.dispose()
    expect(dispose).toHaveBeenCalledTimes(1)
    expect(options.scene.children).toHaveLength(0)
  })
})
