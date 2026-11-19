import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import { cinematicDuel, cinematicCommand, cinematicStep } from './cinematicFixtures'
import { createPerformanceClock, privateRihanFocus } from './performancePresentation'
import { createPerformanceHatsuScene } from './performanceHatsuScene'
import { createCinematicPropsScene } from './cinematicPropsScene'
import { createMelodyFluteScene } from './melodyFluteScene'
import { createCinematicDirector } from './cinematicDirector'
import { performanceCameraEvent } from './performanceCamera'
import { bashoInk } from './bashoWritingPresentation'
import { BASHO_WRITING_FRAMES } from './bashoPoem'
import { MELODY_STARTUP } from './melodyTuning'
import { PREDATOR_ANALYSIS_FRAMES, advancePredator, launchPredator } from './predator'
import { defaultFightComfort } from './fightComfort'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from './types'

function duel(id: FighterId, side: FightSide): FightState {
  const s = beginFight(
    createFight(side === 'player' ? id : 'hisoka', side === 'opponent' ? id : 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
  )
  return {
    ...s,
    player: { ...s.player, x: 42, aura: 100 },
    opponent: { ...s.opponent, x: 54, aura: 100 },
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
  let viewer: FightSide = 'player',
    comfort = defaultFightComfort()
  const scene = new THREE.Scene(),
    options = {
      THREE,
      scene,
      worldX: (x: number) => x / 6,
      worldY: (y: number) => y / 6,
      viewer: () => viewer,
      comfort: () => comfort,
    }
  const props = createCinematicPropsScene(options),
    flute = createMelodyFluteScene(options),
    effects = createPerformanceHatsuScene(options)
  return {
    scene,
    sync(s: FightState, seconds = 0) {
      flute.sync(s, seconds)
      props.sync(s, seconds)
      effects.sync(s, seconds)
    },
    view(v: FightSide) {
      viewer = v
    },
    reduce() {
      comfort = { ...comfort, camera: 0, flashes: false }
    },
    dispose() {
      effects.dispose()
      props.dispose()
      flute.dispose()
    },
  }
}

describe('Melody, Basho and Rihan: type 1 performance, writing and observation', () => {
  for (const side of ['player', 'opponent'] as const) {
    const other = side === 'player' ? 'opponent' : 'player'
    it(`Melody ${side}: separates breath from actual playing without changing the listener or opening an inset`, () => {
      let s = duel('melody', side)
      const clock = createPerformanceClock(),
        camera = createCinematicDirector({ viewer: () => side })
      clock(s, side)
      camera.update(s)
      const health = s[other].health
      s = performAttack(s, side, 'special')
      expect(clock(s, side)).toMatchObject([{ kind: 'breath', owner: side }])
      expect(camera.update(s).detail).toBeNull()
      s = frames(s, MELODY_STARTUP - 1, (n) => {
        expect(camera.update(n).detail).toBeNull()
        clock(n, side)
      })
      expect(s[other].hatsuEffects.entrancedFrames).toBe(0)
      expect(clock(s, side).some((e) => e.kind === 'playing')).toBe(false)
      s = frames(s, 1)
      expect(clock(s, side)).toMatchObject([{ kind: 'playing', owner: side }])
      expect(s[other].hatsuEffects.entrancedFrames).toBe(1)
      s = frames(s, 50, (n) => expect(camera.update(n).detail).toBeNull())
      expect(s[other].health).toBe(health)
      expect(s.projectiles).toHaveLength(0)
      const before = JSON.stringify(s)
      clock(s, side)
      expect(JSON.stringify(s)).toBe(before)
      s = performAttack(s, side, 'special')
      expect(clock(s, side)).toEqual([])
      expect(s[other].hatsuEffects.entrancedFrames).toBe(0)
    })
    it(`Basho ${side}: writes the accepted poem progressively, then confirms completion after sixty simulation steps`, () => {
      let s = duel('basho', side)
      const scene = setup(),
        clock = createPerformanceClock(),
        camera = createCinematicDirector({ viewer: () => side })
      scene.sync(s)
      clock(s, side)
      camera.update(s)
      s = performAttack(s, side, 'special')
      expect(clock(s, side)).toMatchObject([{ kind: 'writing', owner: side }])
      expect(bashoInk(s[side].bashoPoem!).lines).toEqual(['GREAT HIKER', ''])
      const health = s[other].health
      scene.sync(s)
      const pen = scene.scene.getObjectByName(`basho-brush:${side}`)!
      const first = pen.position.toArray()
      s = frames(s, 30, (n) => {
        clock(n, side)
        expect(camera.update(n).detail).toBeNull()
      })
      scene.sync(s)
      expect(pen.position.toArray()).not.toEqual(first)
      const ink = bashoInk(s[side].bashoPoem!)
      expect(ink.progress).toBe(0.5)
      expect(ink.lines.slice(1).join('\n').length).toBeLessThan(s[side].bashoPoem!.text.length)
      expect(s[side].bashoPoem?.ready).toBe(false)
      s = frames(s, BASHO_WRITING_FRAMES - 30, (n) => {
        clock(n, side)
        expect(camera.update(n).detail).toBeNull()
      })
      scene.sync(s)
      expect(clock(s, side)).toMatchObject([{ kind: 'written', owner: side }])
      expect(bashoInk(s[side].bashoPoem!).lines.slice(1).join('\n')).toBe(s[side].bashoPoem!.text)
      expect(pen.visible).toBe(false)
      expect(s[other].health).toBe(health)
      scene.dispose()
      expect(scene.scene.children).toHaveLength(0)
    })
    it(`Rihan ${side}: highlights only his own acquired study and never exposes a prey identity`, () => {
      let s = cinematicDuel('rihan', side)
      const clock = createPerformanceClock(),
        foreign = createPerformanceClock(),
        camera = createCinematicDirector({ viewer: () => side })
      clock(s, side)
      foreign(s, other)
      camera.update(s)
      const health = s[other].health
      s = cinematicCommand(s, side)
      expect(clock(s, side)).toMatchObject([{ kind: 'watch', owner: side }])
      expect(foreign(s, other)).toEqual([])
      const found = new Set<string>()
      for (let i = 0; i < PREDATOR_ANALYSIS_FRAMES; i++) {
        s = cinematicStep(s)
        clock(s, side).forEach((e) => found.add(e.kind))
        expect(foreign(s, other)).toEqual([])
        expect(camera.update(s).detail).toBeNull()
      }
      expect(found.has('study')).toBe(true)
      expect(found.has('ready')).toBe(true)
      expect(privateRihanFocus(s, side).frames).toBe(PREDATOR_ANALYSIS_FRAMES)
      expect(JSON.stringify(clock(s, side))).not.toMatch(/bungee|preyId|hisoka|known|signature/)
      expect(s[other].health).toBe(health)
      expect(s[side].predator?.hunt).toBeNull()
      expect(camera.update(launchPredator(s, side)).detail?.eventId).toBe('rihan.hunt')
    })
  }
  it('does not turn watching an empty duel into an acquired analysis', () => {
    let s = duel('rihan', 'player')
    const clock = createPerformanceClock()
    clock(s, 'player')
    s = performAttack(s, 'player', 'special')
    const found = new Set<string>()
    s = frames(s, 200, (n) => clock(n, 'player').forEach((e) => found.add(e.kind)))
    expect(found.has('study')).toBe(false)
    expect(found.has('ready')).toBe(false)
    expect(privateRihanFocus(s, 'player')).toMatchObject({
      watching: true,
      analysis: false,
      frames: 0,
      ready: false,
    })
  })
  it('keeps the observation marker frozen when concealed prey cannot actually be studied', () => {
    let s = cinematicDuel('rihan')
    s = frames(cinematicCommand(s), 25)
    const acquired = s.player.predator!.analysis!.observedFrames
    s = { ...s, opponent: { ...s.opponent, nen: { ...s.opponent.nen, in: true } } }
    const scene = setup()
    scene.sync(s)
    const root = scene.scene.getObjectByName('performance-type-one')!,
      focus = scene.scene.getObjectByName('rihan-private-focus')!
    const scale = focus.scale.toArray()
    for (let i = 0; i < 30; i++) {
      s = advancePredator({ ...s, frame: s.frame + 1 })
      scene.sync(s)
    }
    expect(root.userData.observedFrames).toBe(acquired)
    expect(focus.scale.toArray()).toEqual(scale)
    scene.view('opponent')
    scene.sync(s)
    expect(focus.visible).toBe(false)
    expect(root.userData.events).toEqual([])
    expect(root.userData.observedFrames).toBe(0)
    scene.dispose()
  })
  it('requires the real instrument and removes the performance on interruption', () => {
    const empty = duel('melody', 'player')
    empty.player.equipment = []
    const clock = createPerformanceClock()
    clock(empty, 'player')
    expect(clock(performAttack(empty, 'player', 'special'), 'player')).toEqual([])
    const scene = setup()
    let s = duel('melody', 'player')
    scene.sync(s)
    s = frames(performAttack(s, 'player', 'special'), 30)
    scene.sync(s)
    const flow = scene.scene.getObjectByName('melody-phrasing:player')!
    expect(flow.visible).toBe(true)
    s = tickFight(s, { ...EMPTY_INPUT, guard: true }, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    scene.sync(s)
    expect(flow.visible).toBe(false)
    scene.dispose()
  })
  it('removes the unfinished poem and its strokes when movement interrupts writing', () => {
    const scene = setup()
    let s = duel('basho', 'player')
    scene.sync(s)
    s = frames(performAttack(s, 'player', 'special'), 20)
    scene.sync(s)
    s = tickFight(s, { ...EMPTY_INPUT, right: true }, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    scene.sync(s)
    expect(s.player.bashoPoem).toBeUndefined()
    expect(scene.scene.getObjectByName('basho-poem:player')!.visible).toBe(false)
    expect(scene.scene.getObjectByName('performance-type-one')!.userData.events).toEqual([])
    scene.dispose()
  })
  it('does not alter the camera staging of manifested fire or a real Predator hunt', () => {
    for (const eventId of ['basho.fire', 'rihan.hunt', 'rihan.devour', 'rihan.seal']) {
      const event = {
        cue: { frame: 1, side: 'player' as const, strength: 1, hold: 22, release: 44 },
        detail: {
          kind: 'focus' as const,
          side: 'player' as const,
          labelFr: '',
          labelEn: '',
          eventId,
        },
      }
      expect(performanceCameraEvent(event)).toBe(event)
    }
  })
  it('freezes paper, pen and breath on pause, clears past accents on rebuild, and honors reduced motion', () => {
    const scene = setup()
    let s = duel('basho', 'player')
    scene.sync(s)
    s = frames(performAttack(s, 'player', 'special'), 9)
    scene.sync(s)
    const pen = scene.scene.getObjectByName('basho-brush:player')!
    const paper = scene.scene.getObjectByName('basho-poem:player')!
    const pose = [pen.position.toArray(), pen.quaternion.toArray(), paper.position.toArray()]
    scene.sync(s, 999)
    expect([pen.position.toArray(), pen.quaternion.toArray(), paper.position.toArray()]).toEqual(
      pose,
    )
    expect(createPerformanceClock()(s, 'player')).toEqual([])
    scene.reduce()
    scene.sync(s)
    expect(scene.scene.getObjectByName('performance-type-one')!.visible).toBe(false)
    expect(paper.visible).toBe(true)
    const mesh = pen as THREE.Mesh,
      disposed = vi.spyOn(mesh.geometry, 'dispose')
    scene.dispose()
    expect(disposed).toHaveBeenCalledTimes(1)
  })
  it('anchors breath to the live flute, freezes it in pause and follows a rebuilt rig', () => {
    const scene = new THREE.Scene()
    let figure = new THREE.Group()
    const instrument = () => {
      const flute = new THREE.Group()
      flute.name = 'signature-flute'
      flute.position.set(1, 2, 3)
      figure.add(flute)
      return flute
    }
    const first = instrument()
    const effects = createPerformanceHatsuScene({
      THREE,
      scene,
      worldX: (x) => x / 6,
      worldY: (y) => y / 6,
      figureOf: () => figure,
    })
    let s = duel('melody', 'player')
    effects.sync(s, 0)
    s = frames(performAttack(s, 'player', 'special'), 20)
    effects.sync(s, 0)
    const breath = scene.getObjectByName('melody-phrasing:player')!
    expect(breath.position.toArray()).toEqual([1, 2, 3.15])
    first.position.x = 9
    effects.sync(s, 999)
    expect(breath.position.x).toBe(1)
    figure = new THREE.Group()
    instrument().position.x = 5
    effects.sync(s, 1000)
    expect(breath.position.x).toBe(5)
    effects.dispose()
  })
  it('resets transient accents on viewer change, round change and rewinding', () => {
    const fresh = duel('basho', 'player'),
      clock = createPerformanceClock()
    clock(fresh, 'player')
    let s = performAttack(fresh, 'player', 'special')
    expect(clock(s, 'player')).toHaveLength(1)
    expect(clock(s, 'opponent')).toEqual([])
    s = frames(s, 5)
    clock(s, 'opponent')
    expect(clock(fresh, 'opponent')).toEqual([])
    expect(clock({ ...s, roundNumber: s.roundNumber + 1 }, 'opponent')).toEqual([])
    expect(clock({ ...s, phase: 'finished' }, 'opponent')).toEqual([])
  })
})
