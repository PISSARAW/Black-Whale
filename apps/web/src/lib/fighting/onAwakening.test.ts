import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, tickFight, performAttack } from './engine'
import { applyAuraContext } from './nen'
import { advanceOn } from './onTechnique'
import { createOnAwakeningClock, ON_LOOK, ON_AWAKENING_FRAMES } from './onAwakening'
import { buildFightFigure, fightFigureKey } from './fighterFigure'
import { bodyPlan } from './fightBodyMotion'
import { FIGHTING_ROSTER } from './roster'
import { createCinematicDirector } from './cinematicDirector'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

const OATH = { ...EMPTY_INPUT, aura: true, hatsu: true }
const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
function fresh(): FightState {
  const state = beginFight(createFight('hisoka', 'kurapika', { mode: 'versus-local' }))
  return { ...state, player: { ...state.player, on: { grudge: 100, sealFrames: 0 } } }
}
function swear(state: FightState, side: FightSide = 'player'): FightState {
  return {
    ...state,
    [side]: applyAuraContext({ ...state[side], on: { grudge: 100, sealFrames: 0 } }, OATH),
  }
}
function colour(root: THREE.Object3D, name: string) {
  return (
    (root.getObjectByName(name) as THREE.Mesh).material as THREE.MeshBasicMaterial
  ).color.getHex()
}

describe('On awakening presentation', () => {
  it('starts on an accepted oath, advances on simulation frames and never restarts on a repeated render', () => {
    const before = fresh()
    const clock = createOnAwakeningClock(before)
    const rejected = tickFight({ ...before, player: { ...before.player, on: undefined } }, OATH, {
      dt: 1 / 60,
      opponentInput: EMPTY_INPUT,
    })
    expect(clock(rejected).player).toBeNull()
    const active = tickFight(before, OATH, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(active.player.nen.on).toBe(true)
    expect(clock(active)).toEqual({ player: 0, opponent: null })
    expect(clock(active).player).toBe(0)
    const later = { ...active, frame: active.frame + 47 }
    expect(clock(later).player).toBe(47)
    expect(clock(later).player).toBe(47)
    expect(clock({ ...later, frame: active.frame + ON_AWAKENING_FRAMES }).player).toBeNull()
  })

  it('separates both players and clears on exit, rewind and a new round', () => {
    const initial = fresh()
    const clock = createOnAwakeningClock(initial)
    const first = swear(initial)
    expect(clock(first).player).toBe(0)
    const both = swear({ ...first, frame: 20 }, 'opponent')
    expect(clock(both)).toEqual({ player: 20, opponent: 0 })
    expect(clock({ ...both, frame: 25, player: initial.player })).toEqual({
      player: null,
      opponent: 5,
    })
    expect(clock({ ...both, frame: 2 })).toEqual({ player: null, opponent: null })
    expect(clock({ ...both, roundNumber: 2 })).toEqual({ player: null, opponent: null })
    expect(createOnAwakeningClock(first)(first).player).toBeNull()
  })

  it('yields the flourish to an attack, movement, guard, injury or aerial state', () => {
    const fighter = swear(fresh()).player
    const resting = bodyPlan(fighter, { seconds: 1, progress: 0, onAwakeningFrame: 40 })!
    expect(resting.key).toBe('on-awakening')
    for (const pose of ['walk', 'guard', 'hit', 'jump', 'down', 'ko'] as const) {
      const changed = { ...fighter, pose }
      expect(bodyPlan(changed, { seconds: 1, progress: 0, onAwakeningFrame: 40 })).toEqual(
        bodyPlan(changed, { seconds: 1, progress: 0 }),
      )
    }
    const attack = performAttack(swear(fresh()), 'player', 'light').player
    expect(bodyPlan(attack, { seconds: 1, progress: 0, onAwakeningFrame: 40 })).toEqual(
      bodyPlan(attack, { seconds: 1, progress: 0 }),
    )
  })

  it('uses a frontal live view and leaves the actual duel identical', () => {
    let state = fresh()
    const director = createCinematicDirector()
    const clock = createOnAwakeningClock(state)
    director.update(state)
    state = swear(state)
    const direction = director.update(state)
    expect(direction.detail).toMatchObject({ eventId: 'nen.on', frontal: true })
    expect(director.update({ ...state, frame: 60 }).detail).toMatchObject({
      anchors: [{ type: 'rig', side: 'player', part: 'head' }],
      isolate: true,
    })
    // Restart the local camera after this framing probe before comparing the live duel.
    director.update(state)
    let control = state
    for (let frame = 0; frame < 180; frame++) {
      clock(state)
      director.update(state)
      bodyPlan(state.player, {
        seconds: frame / 60,
        progress: 0,
        onAwakeningFrame: clock(state).player,
      })
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
      control = tickFight(control, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    }
    expect(state).toEqual(control)
    expect(state.frame).toBe(180)
    expect(state.player.nen.on).toBe(true)
  })

  it.each(FIGHTING_ROSTER.map(({ id }) => id))(
    '%s: golden irises and dark sclera last exactly as long as On',
    (id) => {
      const base = createFight(id, 'hisoka').player
      const active = applyAuraContext({ ...base, on: { grudge: 100, sealFrames: 0 } }, OATH)
      expect(active.nen.on).toBe(true)
      const normal = buildFightFigure({ THREE, glow, fighter: base })
      const model = buildFightFigure({ THREE, glow, fighter: active })
      for (const side of ['left', 'right']) {
        const eye = model.root.getObjectByName(`face-eye-${side}`)!
        expect(colour(eye, 'eye-pupil')).toBe(ON_LOOK.iris)
        expect(colour(eye, 'eye-sclera')).toBe(ON_LOOK.sclera)
      }
      expect(colour(normal.root, 'eye-sclera')).not.toBe(ON_LOOK.sclera)
      expect(fightFigureKey(active)).not.toBe(fightFigureKey(base))
      const spent = advanceOn({ ...active, on: { grudge: 0.01, sealFrames: 0 } })
      expect(spent.nen.on).toBe(false)
      const restored = buildFightFigure({ THREE, glow, fighter: spent })
      expect(colour(restored.root, 'eye-pupil')).toBe(colour(normal.root, 'eye-pupil'))
      expect(colour(restored.root, 'eye-sclera')).toBe(colour(normal.root, 'eye-sclera'))
    },
  )

  it('gives On precedence over scarlet eyes without revealing physically closed eyes', () => {
    const base = createFight('kurapika', 'tserriednich').player
    const fighter = {
      ...base,
      nen: { ...base.nen, on: true },
      kurapika: { ...base.kurapika!, emperorTime: true },
    }
    const model = buildFightFigure({ THREE, glow, fighter })
    expect(colour(model.root, 'eye-pupil')).toBe(ON_LOOK.iris)
    const closed = buildFightFigure({
      THREE,
      glow,
      fighter: { ...fighter, parallelEyesClosed: true },
    })
    expect(closed.root.getObjectByName('face-eye-left')!.scale.y).toBe(0.08)
  })
})
