import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, nextRound, performAttack, performMove, tickFight } from './engine'
import { toggleEmperorTime } from './kurapikaActions'
import { createPassageClock } from './passagePresentation'
import { createPassageAccentScene } from './passageAccentScene'
import { createVoconteDoorScene } from './voconteDoorScene'
import { createCinematicDirector } from './cinematicDirector'
import { interactWithPreparation } from './preparationSimulation'
import { defaultFightComfort } from './fightComfort'
import {
  EMPTY_INPUT,
  type FightInput,
  type FighterId,
  type FightSide,
  type FightState,
} from './types'

function duel(id: FighterId, side: FightSide = 'player'): FightState {
  const s = beginFight(
    createFight(side === 'player' ? id : 'hisoka', side === 'opponent' ? id : 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: {
          mode: id === 'luini' ? 'scenario' : 'duel',
          resources: id === 'luini' ? ['rooms'] : [],
          cohorts: [],
        },
      },
    }),
  )
  return {
    ...s,
    player: { ...s.player, x: id === 'luini' ? 20 : 22, aura: 100 },
    opponent: { ...s.opponent, x: id === 'luini' ? 80 : 86, aura: 100 },
  }
}
function frames(
  s: FightState,
  count: number,
  watch: (state: FightState) => void = () => {},
  control?: { side: FightSide; input: FightInput },
) {
  for (let i = 0; i < count; i++) {
    s = tickFight(s, control?.side === 'player' ? control.input : EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: control?.side === 'opponent' ? control.input : EMPTY_INPUT,
    })
    watch(s)
  }
  return s
}
const cast = (s: FightState, side: FightSide) => performAttack(s, side, 'special')

describe('Luini and Voconte type 1 passage presentation', () => {
  for (const side of ['player', 'opponent'] as const) {
    it(`Luini ${side}: anchors without moving, then shows actual departure, return and invalidation`, () => {
      const clock = createPassageClock(),
        camera = createCinematicDirector({ viewer: () => side })
      let s = duel('luini', side)
      clock(s)
      camera.update(s)
      const originalX = s[side].x
      const frozen = JSON.stringify(s)
      const anchored = cast(s, side)
      expect(anchored[side].aura).toBe(s[side].aura - 20)
      const events = clock(anchored)
      expect(events.map((e) => e.kind)).toEqual(['anchor'])
      expect(anchored[side].x).toBe(originalX)
      expect(JSON.stringify(s)).toBe(frozen)
      expect(camera.update(anchored).detail).toBeNull()
      const watch = (state: FightState) => {
        clock(state)
        expect(camera.update(state).detail).toBeNull()
      }
      s = frames(anchored, 18, watch)
      expect(clock(s)).toEqual([])
      const departureAura = s[side].aura
      s = cast(s, side)
      expect(s[side].aura).toBeCloseTo(departureAura - 20)
      expect(clock(s)).toMatchObject([
        {
          source: 'luini',
          kind: 'transit',
          traveler: side,
          from: { x: originalX },
          to: { x: side === 'player' ? 85 : 15 },
        },
      ])
      expect(camera.update(s).detail).toBeNull()
      s = frames(s, 18, watch)
      const returnAura = s[side].aura
      s = cast(s, side)
      expect(s[side].aura).toBeCloseTo(returnAura - 20)
      expect(clock(s)[0].to?.x).toBe(originalX)
      expect(camera.update(s).detail).toBeNull()
      s = frames(s, 18, watch)
      s = frames(interactWithPreparation(s, side), 1)
      expect(clock(s)).toMatchObject([{ kind: 'close', source: 'luini' }])
      expect(camera.update(s).detail).toBeNull()
      expect(s.battlefield?.entities.find((e) => e.id === `${side}:room`)?.invalidated).toBe(true)
      expect(cast(s, side)).toBe(s)
      expect(s[side].health).toBe(s[side].maxHealth)
      expect(createPassageClock()(s)).toEqual([])
      expect(clock(nextRound({ ...s, phase: 'finished', winner: side }))).toEqual([])
    })
    it(`Voconte ${side}: links only after startup and folds only when closure completes`, () => {
      const clock = createPassageClock(),
        camera = createCinematicDirector({ viewer: () => side })
      let s = duel('voconte', side)
      clock(s)
      camera.update(s)
      s = cast(s, side)
      expect(clock(s)).toEqual([])
      expect(camera.update(s).detail).toBeNull()
      s = frames(s, 17, (n) => {
        expect(clock(n)).toEqual([])
        expect(camera.update(n).detail).toBeNull()
      })
      s = frames(s, 1)
      expect(clock(s)).toMatchObject([{ kind: 'link', source: 'voconte', age: 0 }])
      const ages: number[] = [0]
      s = frames(s, 30, (n) => {
        for (const e of clock(n)) ages.push(e.age)
        expect(camera.update(n).detail).toBeNull()
      })
      expect(ages).toEqual(Array.from({ length: 18 }, (_, i) => i))
      const closingAura = s[side].aura
      s = cast(s, side)
      expect(s[side].aura).toBeCloseTo(closingAura - 20)
      expect(clock(s)).toEqual([])
      s = frames(s, 18, (n) => {
        clock(n)
        expect(camera.update(n).detail).toBeNull()
      })
      expect(s.voconteDoors?.networks[side]?.active).toBe(false)
      expect(clock(s)[0].kind).toBe('close')
    })
    it.each(['player', 'opponent'] as const)(
      `Voconte ${side}: uses the actual %s crossing record and never moves the body itself`,
      (traveler) => {
        const clock = createPassageClock()
        let s = duel('voconte', side)
        clock(s)
        s = frames(cast(s, side), 45, clock)
        s = { ...s, [traveler]: { ...s[traveler], x: 29.95 } }
        clock(s)
        s = frames(s, 1, () => {}, { side: traveler, input: { ...EMPTY_INPUT, right: true } })
        const before = JSON.stringify(s),
          events = clock(s)
        expect(events).toMatchObject([
          {
            kind: 'transit',
            owner: side,
            traveler,
            from: { x: 30 },
            to: { x: 70 },
            started: s.voconteDoors!.lastTransit![traveler]!.frame,
          },
        ])
        expect(s[traveler].x).toBe(72)
        expect(s[traveler].wakeupInvulnerableFrames).toBe(0)
        expect(clock(s)).toEqual(events)
        expect(JSON.stringify(s)).toBe(before)
      },
    )
  }
  it('does not accent rejected preparation, interrupted linking, ordinary walking or a reverse crossing', () => {
    const clock = createPassageClock()
    let s = duel('luini')
    s = { ...s, player: { ...s.player, x: 50 } }
    clock(s)
    expect(clock(cast(s, 'player'))).toEqual([])
    s = duel('voconte')
    clock(s)
    s = cast(s, 'player')
    frames({ ...s, player: { ...s.player, attack: null, hitStun: 20 } }, 50, (n) =>
      expect(clock(n)).toEqual([]),
    )
    s = frames(cast(duel('voconte'), 'player'), 45)
    clock(s)
    s = { ...s, player: { ...s.player, x: 30.1 } }
    clock(s)
    s = frames(s, 1, () => {}, { side: 'player', input: { ...EMPTY_INPUT, left: true } })
    expect(clock(s)).toEqual([])
  })
  it('keeps the other owner’s actual link usable while one network closes', () => {
    let s = beginFight(
      createFight('voconte', 'voconte', { mode: 'versus-local', formatId: 'knockout' }),
    )
    const clock = createPassageClock()
    clock(s)
    s = frames(cast(cast(s, 'player'), 'opponent'), 45, clock)
    s = frames(cast(s, 'player'), 18, clock)
    expect(s.voconteDoors?.networks.player?.active).toBe(false)
    expect(s.voconteDoors?.networks.opponent?.active).toBe(true)
    const scene = new THREE.Scene(),
      effect = createVoconteDoorScene({ THREE, scene, worldX: (x) => x, worldY: (y) => y })
    effect.sync(s, 0)
    expect(scene.getObjectByName('voconte:frame:A')!.children[3].visible).toBe(true)
    effect.dispose()
  })
  it('finishes Luini’s real borrowed return accent when Dolphin returns the ability', () => {
    let s = beginFight(
      createFight('kurapika', 'luini', {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: { preparation: { mode: 'scenario', resources: ['rooms'], cohorts: [] } },
      }),
    )
    s = toggleEmperorTime(s, 'player')
    s = {
      ...s,
      player: {
        ...s.player,
        x: 20,
        aura: 100,
        kurapika: {
          ...s.player.kurapika!,
          held: {
            source: 'luini',
            victim: 'opponent',
            moveId: 'luini:neutralSpecial',
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
    }
    const use = (state: FightState) =>
      performMove({
        state,
        side: 'player',
        action: 'special',
        input: {
          ...EMPTY_INPUT,
          left: state.player.facing === 1,
          right: state.player.facing === -1,
        },
      })
    const clock = createPassageClock()
    clock(s)
    s = frames(use(s), 18, clock)
    s = frames(use(s), 18, clock)
    expect(s.player.x).toBe(85)
    s = use(s)
    expect(s.player.x).toBe(20)
    expect(s.player.kurapika?.held).toBeNull()
    expect(clock(s).some((e) => e.kind === 'transit' && e.source === 'luini')).toBe(true)
  })
  it('preserves physical frames under In, follows P2/Gyo, freezes accents and honors reduced motion', () => {
    let s = duel('voconte', 'opponent'),
      viewer: FightSide = 'player',
      comfort = defaultFightComfort()
    const scene = new THREE.Scene(),
      options = {
        THREE,
        scene,
        worldX: (x: number) => x / 5,
        worldY: (y: number) => y / 5,
        viewer: () => viewer,
        comfort: () => comfort,
      }
    const framesScene = createVoconteDoorScene(options),
      effect = createPassageAccentScene(options)
    effect.sync(s, 0)
    s = frames(cast(s, 'opponent'), 18, (n) => effect.sync(n, n.frame))
    s = { ...s, opponent: { ...s.opponent, nen: { ...s.opponent.nen, in: true } } }
    framesScene.sync(s, 0)
    effect.sync(s, 0)
    const frame = scene.getObjectByName('voconte:frame:A')!,
      root = scene.getObjectByName('passage-type-one')!
    const wood = frame.children[0] as THREE.Mesh,
      dispose = vi.spyOn(wood.geometry, 'dispose')
    expect(frame.visible).toBe(true)
    expect(wood.visible).toBe(true)
    expect(frame.children[3].visible).toBe(false)
    expect(root.children[0].visible).toBe(false)
    viewer = 'opponent'
    framesScene.sync(s, 0)
    effect.sync(s, 0)
    expect(frame.children[3].visible).toBe(true)
    expect(root.children[0].visible).toBe(true)
    const pose = root.children[0].children.map((p) => p.scale.toArray())
    effect.sync(s, 900)
    expect(root.children[0].children.map((p) => p.scale.toArray())).toEqual(pose)
    viewer = 'player'
    s = { ...s, player: { ...s.player, nen: { ...s.player.nen, gyo: true } } }
    framesScene.sync(s, 0)
    effect.sync(s, 0)
    expect(frame.children[3].visible).toBe(true)
    comfort = { ...comfort, camera: 0, flashes: false }
    effect.sync(s, 0)
    expect(root.visible).toBe(false)
    expect(wood.visible).toBe(true)
    effect.dispose()
    expect(dispose).not.toHaveBeenCalled()
    framesScene.dispose()
    expect(scene.children).toHaveLength(0)
  })
})
