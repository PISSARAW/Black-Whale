import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import {
  beginFight,
  createFight,
  nextRound,
  performAttack,
  performAuraAttack,
  tickFight,
} from './engine'
import { createBlinkyClock } from './blinkyPresentation'
import { createBlinkySuctionScene } from './blinkySuctionScene'
import { createCinematicDirector } from './cinematicDirector'
import { designateBlinkyTarget } from './blinky'
import { performArenaAction } from './arenaActions'
import { buildFightFigure } from './fighterFigure'
import { defaultFightComfort } from './fightComfort'
import { attackData } from './frameData'
import { EMPTY_INPUT, type FightInput, type FightSide, type FightState } from './types'

function duel(side: FightSide = 'player', arena = false): FightState {
  const s = beginFight(
    createFight(
      side === 'player' ? 'shizuku' : 'hisoka',
      side === 'opponent' ? 'shizuku' : 'hisoka',
      { mode: 'versus-local', formatId: 'knockout', environment: { arenaInteractions: arena } },
    ),
  )
  return {
    ...s,
    player: { ...s.player, x: 30, aura: 100 },
    opponent: { ...s.opponent, x: 45, aura: 100 },
  }
}
function cast(state: FightState, side: FightSide, slot = 'neutralSpecial') {
  return performAuraAttack({
    state,
    side,
    kind: 'special',
    moveId: `shizuku:${slot}`,
    auraCharged: false,
  })
}
function frames(
  state: FightState,
  count: number,
  observe: (s: FightState) => void = () => {},
  input: FightInput = EMPTY_INPUT,
) {
  for (let i = 0; i < count; i++) {
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: input })
    observe(state)
  }
  return state
}
function wounded(s: FightState, side: FightSide) {
  const other = side === 'player' ? 'opponent' : 'player'
  s = { ...s, [other]: { ...s[other], x: s[side].x + s[side].facing * 7 } }
  const hit = frames(performAttack(s, side, 'heavy'), 70)
  expect(hit[other].openWounds).toBeGreaterThan(0)
  return hit
}
const glow = (color: number, opacity = 1) => new THREE.MeshBasicMaterial({ color, opacity })

describe('Blinky type 1 presentation follows actual suction', () => {
  for (const side of ['player', 'opponent'] as const) {
    it(`${side}: follows a real swallowed card and keeps the camera in combat`, () => {
      const clock = createBlinkyClock(),
        camera = createCinematicDirector({ viewer: () => side })
      const other = side === 'player' ? 'opponent' : 'player'
      let s = designateBlinkyTarget(duel(side), side, 'card')
      s = { ...s, [other]: { ...s[other], x: s[side].x + s[side].facing * 30 } }
      s = performAttack(s, other, 'ranged')
      s = frames(s, attackData('ranged', s[other]).startup)
      clock(s)
      camera.update(s)
      const found = new Set<string>(),
        starts: number[] = []
      const watch = (state: FightState) => {
        const frozen = JSON.stringify(state),
          shown = clock(state)[side]
        for (const event of shown.captures) if (event.kind === 'object') found.add(event.id)
        if (shown.start !== null) starts.push(shown.start)
        expect(camera.update(state).detail).toBeNull()
        expect(JSON.stringify(state)).toBe(frozen)
      }
      s = frames(cast(s, side), 83, watch)
      expect(found.size).toBe(1)
      expect(starts).toEqual(Array.from({ length: 18 }, (_, i) => i))
      expect(s[side].blinky?.lastObject?.shape).toBe('card')
      expect(s.projectiles).toHaveLength(0)
      expect(s[side].health).toBe(s[side].maxHealth)
      expect(createBlinkyClock()(s)[side].captures).toEqual([])
    })
    it.each([1, 2, 4])(
      `${side}: preserves real blood extractions with a render every %s simulation frames`,
      (stride) => {
        const clock = createBlinkyClock(),
          camera = createCinematicDirector({ viewer: () => side })
        let s = wounded(duel(side), side)
        const other = side === 'player' ? 'opponent' : 'player',
          hp = s[other].health
        clock(s)
        camera.update(s)
        const pulses = new Set<string>()
        s = cast(s, side, 'finisher')
        for (let i = 0; i < 140; i += stride) {
          s = frames(s, stride)
          for (const event of clock(s)[side].captures)
            if (event.kind === 'blood') pulses.add(event.id)
          expect(camera.update(s).detail).toBeNull()
        }
        expect(pulses.size).toBe(6)
        expect(s[other].health).toBe(hp - 18)
        expect(s[other].hitStun).toBe(0)
        expect(clock(nextRound({ ...s, phase: 'finished', winner: side }))[side].captures).toEqual(
          [],
        )
      },
    )
  }
  it('does not draw decorative blood from covered wounds or an empty suction', () => {
    const clock = createBlinkyClock()
    let s = wounded(duel(), 'player')
    clock(s)
    const hp = s.opponent.health
    s = frames(
      cast(s, 'player', 'finisher'),
      100,
      (state) => expect(clock(state).player.captures).toEqual([]),
      { ...EMPTY_INPUT, plugWounds: true },
    )
    expect(s.opponent.health).toBe(hp)
    s = duel()
    clock(s)
    frames(cast(s, 'player'), 75, (state) => expect(clock(state).player.captures).toEqual([]))
    expect(cast(duel(), 'player', 'finisher').player.attack).toBeNull()
  })
  it('animates only a genuinely stored arena object, with no duplicate entity', () => {
    const clock = createBlinkyClock()
    let s = duel('player', true)
    s = { ...s, player: { ...s.player, x: 27 } }
    clock(s)
    const ids = new Set<string>()
    s = frames(performArenaAction(s, 'player', performAuraAttack), 40, (state) => {
      for (const event of clock(state).player.captures)
        if (event.kind === 'arena') ids.add(event.id)
    })
    expect(ids.size).toBe(1)
    expect(s.player.blinky?.lastArenaObject).toBe('arena:crate:34')
    expect(s.battlefield!.entities.filter((e) => e.id === 'arena:crate:34')).toHaveLength(1)
  })
  it('anchors material trails to the live mouth, freezes on pause, clears on Nen loss and preserves rig resources', () => {
    let s = wounded(duel(), 'player'),
      comfort = defaultFightComfort()
    const scene = new THREE.Scene(),
      model = buildFightFigure({ THREE, fighter: s.player, glow })
    scene.add(model.root)
    const part = model.root.getObjectByName('open-mouth') as THREE.Mesh
    const dispose = vi.spyOn(part.geometry, 'dispose')
    const effect = createBlinkySuctionScene({
      THREE,
      scene,
      worldX: (x) => x,
      worldY: (y) => y,
      figureOf: (side) => (side === 'player' ? model.turns : undefined),
      comfort: () => comfort,
    })
    effect.sync(s, 0)
    s = cast(s, 'player', 'finisher')
    let active: FightState | null = null
    for (let i = 0; i < 60; i++) {
      s = frames(s, 1)
      effect.sync(s, i)
      if (scene.children.some((n) => n.name.startsWith('blinky-capture:'))) {
        active = s
        break
      }
    }
    expect(active).not.toBeNull()
    const captures = () => scene.children.filter((n) => n.name.startsWith('blinky-capture:'))
    const before = captures().map((n) => n.children.map((c) => c.position.toArray()))
    const orientation = model.root.getObjectByName('shizuku-blinky')!.quaternion.toArray()
    effect.sync(s, 999)
    expect(captures().map((n) => n.children.map((c) => c.position.toArray()))).toEqual(before)
    expect(model.root.getObjectByName('shizuku-blinky')!.quaternion.toArray()).toEqual(orientation)
    const group = scene.getObjectByName('blinky-suction:player')!
    const position = part.getWorldPosition(new THREE.Vector3()),
      last = (group.children[0] as THREE.Line).geometry.getAttribute('position')
    expect(last.getX(2)).toBeCloseTo(position.x)
    comfort = { ...comfort, camera: 0, flashes: false }
    effect.sync(s, 1000)
    expect(captures()).toHaveLength(0)
    expect(group.visible).toBe(false)
    comfort = defaultFightComfort()
    s = frames(
      {
        ...s,
        player: { ...s.player, hatsuEffects: { ...s.player.hatsuEffects, forcedZetsuFrames: 60 } },
      },
      1,
    )
    effect.sync(s, 1001)
    expect(captures()).toHaveLength(0)
    effect.dispose()
    expect(dispose).not.toHaveBeenCalled()
  })
})
