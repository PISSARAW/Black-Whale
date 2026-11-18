import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { buildFightFigure } from './fighterFigure'
import { bodyPlan, fightBodyMotion } from './fightBodyMotion'
import { physicalHitPose } from './fightHitResponse'
import { physicalFallPose } from './fightFallResponse'
import { fightGroundContact, lowestBodyHeight } from './fightGroundContact'
import { createFightPoseContinuity, physicalComboCurve } from './fightPoseContinuity'
import { createFightReactionPresentation } from './fightReactionPresentation'
import { createFightContactAlignment, fightContactTarget } from './fightContactAlignment'
import { createFightImpactScene } from './fightImpactScene'
import { defaultFightComfort } from './fightComfort'
import { fightReplayHash } from './fightReplayHash'
import { fightRigOf } from './fightRig'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { attackData } from './frameData'
import { EMPTY_INPUT, type FighterId } from './types'
import type { BodyPlan } from './fightPose'

const pairs: [FighterId, FighterId][] = [
  ['hisoka', 'machi'],
  ['phinks', 'kurapika'],
  ['shizuku', 'franklin'],
]
const glow = (color: number) => new THREE.MeshBasicMaterial({ color })
function contact(pair: [FighterId, FighterId]) {
  let state = beginFight(createFight(...pair, { mode: 'versus-local', formatId: 'knockout' }))
  state = { ...state, player: { ...state.player, x: 44 }, opponent: { ...state.opponent, x: 50 } }
  const read = createFightReactionPresentation()
  state = performMove({ state, side: 'player', action: 'heavy' })
  for (let i = 0; i < 60 && !state.impact; i++) {
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    read(state, 'opponent', { fighter: state.opponent, seconds: state.frame / 60 })
  }
  expect(state.impact?.blocked).toBe(false)
  return { state, read }
}

describe('reference exchange reactions', () => {
  it.each(pairs)(
    '%s / %s: carries local impact into chest and catching step without changing gameplay',
    (a, b) => {
      const { state, read } = contact([a, b])
      const hash = fightReplayHash(state)
      const context = read(state, 'opponent', {
        fighter: state.opponent,
        seconds: state.frame / 60,
      })
      expect(context.physicalHit).toBeDefined()
      const hit = context.physicalHit!
      const first = physicalHitPose(hit, 0)
      const later = physicalHitPose(hit, Math.min(0.45, 7 / hit.duration))
      expect(later.rearKnee![0]).toBeGreaterThan(first.rearKnee![0])
      expect(later.chest).not.toEqual(first.chest)
      expect(first.leadElbow![0]).toBeLessThan(0)
      expect(physicalHitPose(hit, 1).chest![0]).not.toBe(0)
      const plan = bodyPlan(state.opponent, { ...context, seconds: state.frame / 60 })!
      expect(plan.key).toBe(`physical-hit:${hit.sequence}`)
      expect(plan.reactionFrame).toBe(0)
      expect(fightReplayHash(state)).toBe(hash)
    },
  )
  it('gives the heavy body less displacement and keeps a distinct head / torso response', () => {
    const { state, read } = contact(['shizuku', 'franklin'])
    const hit = read(state, 'opponent', { fighter: state.opponent, seconds: 1 }).physicalHit!
    const heavy = physicalHitPose(hit, 0.3)
    const light = physicalHitPose(
      { ...hit, force: (hit.force / 0.64) * 1.14, victim: 'machi' },
      0.3,
    )
    expect(Math.abs(light.chest![0])).toBeGreaterThan(Math.abs(heavy.chest![0]))
    const head = physicalHitPose({ ...hit, zone: 'head', crush: false }, 0)
    const torso = physicalHitPose({ ...hit, zone: 'torso', crush: false }, 0)
    expect(head.head![0]).toBeLessThan(0)
    expect(torso.head![0]).toBeGreaterThan(0)
  })
  it('includes other roster matchups while excluding guarded and projectile reactions', () => {
    const { state, read } = contact(['hisoka', 'machi'])
    const guarded = { ...state, impact: { ...state.impact!, blocked: true, sequence: 2 } }
    expect(
      read(guarded, 'opponent', { fighter: state.opponent, seconds: 2 }).physicalHit,
    ).toBeUndefined()
    const projectile = { ...state, impact: { ...state.impact!, projectileId: 7, sequence: 3 } }
    expect(
      read(projectile, 'opponent', { fighter: state.opponent, seconds: 3 }).physicalHit,
    ).toBeUndefined()
    const outside = { ...state, opponent: { ...state.opponent, id: 'marayam' as const } }
    expect(
      read(outside, 'opponent', { fighter: outside.opponent, seconds: 4 }).poseContinuity,
    ).toBeUndefined()
  })
  it('keeps a scene-owned outgoing pose through actual Nen-driven model replacement', () => {
    const { state, read } = contact(['hisoka', 'machi'])
    const context = read(state, 'opponent', { fighter: state.opponent, seconds: 1 })
    const old = buildFightFigure({ THREE, glow, fighter: state.opponent })
    const fresh = buildFightFigure({
      THREE,
      glow,
      fighter: { ...state.opponent, nen: { ...state.opponent.nen, mode: 'ten' } },
    })
    const angles: number[][] = []
    for (const [i, model] of [old, fresh].entries()) {
      model.animate(i + 1, 'idle', {
        transitionSeconds: 0,
        motion: (human) => {
          fightBodyMotion({ fighter: state.opponent, ...context, seconds: i + 1 })(human)
          const rig = fightRigOf(human)
          angles.push([rig.chest.rotation.x, rig.chest.rotation.y, human.legs[1].rotation.x])
        },
      })
    }
    expect(angles[1]).toEqual(angles[0])
  })
})

describe('momentum and hitstop', () => {
  it('preserves a nonzero outgoing tangent, and the exact contact endpoint', () => {
    const options = {
      from: { leadElbow: [-0.5, 0, 0] as const },
      contact: { leadElbow: [0.4, 0, 0] as const },
      velocity: { leadElbow: [0.08, 0, 0] as const },
      load: {},
      frames: 6,
      progress: 0,
    }
    expect(physicalComboCurve(options).leadElbow).toEqual(options.from.leadElbow)
    const epsilon = 1e-5
    const delta =
      (physicalComboCurve({ ...options, progress: epsilon }).leadElbow![0] + 0.5) / (epsilon * 6)
    expect(delta).toBeCloseTo(0.08, 3)
    expect(physicalComboCurve({ ...options, progress: 1 }).leadElbow).toEqual(
      options.contact.leadElbow,
    )
  })
  it('freezes a renewed hit during hitstop and starts the next hit from the wounded body', () => {
    const flow = createFightPoseContinuity()
    flow({ pose: { body: [-0.1, 0, 0] }, key: 'stance', plant: true, blend: 0 }, 0)
    const hit: BodyPlan = {
      pose: { body: [-0.6, 0, 0] },
      key: 'physical-hit:1',
      plant: true,
      blend: 0,
      reactionFrame: 0,
    }
    const first = flow(hit, 1)
    expect(flow(hit, 9)).toEqual(first)
    const later = flow({ ...hit, reactionFrame: 3 }, 9.05)
    const next = flow({ ...hit, key: 'physical-hit:2', pose: { body: [0.4, 0, 0] } }, 9.06)
    expect(next.body![0]).toBeCloseTo(later.body![0] * 0.28 + 0.4 * 0.72)
  })
})

it.each([1, -1] as const)(
  'corrects a contact toward the posed anatomy with bounded joints, facing %s',
  (facing) => {
    const { state } = contact(['phinks', 'kurapika'])
    state.player.facing = facing
    state.opponent.facing = facing === 1 ? -1 : 1
    const scene = new THREE.Scene()
    const models = {
      player: buildFightFigure({ THREE, glow, fighter: state.player }),
      opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }),
    }
    const read = createFightReactionPresentation()
    for (const side of ['player', 'opponent'] as const) {
      scene.add(models[side].root)
      models[side].root.position.x = side === 'player' ? -facing * 0.45 : 0
      models[side].root.rotation.y = state[side].facing * 1.25
      models[side].animate(1, 'idle', {
        transitionSeconds: 0,
        motion: fightBodyMotion({
          fighter: state[side],
          ...read(state, side, { fighter: state[side], seconds: 1 }),
          seconds: 1,
        }),
      })
    }
    const wrist = models.player.root.getObjectByName(facing === 1 ? 'hand-right' : 'hand-left')!
    const probe = () => wrist.getWorldPosition(new THREE.Vector3())
    const before = probe()
    const rival = humanAnimationRig(models.opponent.turns)!
    const zone = attackData(state.player.attack!.kind, state.player).targetZone
    const target = (zone === 'head' ? rival.head : rival.torso).getWorldPosition(
      new THREE.Vector3(),
    )
    target.x -= facing * 0.1
    const hash = fightReplayHash(state)
    const align = createFightContactAlignment((side) => models[side].turns)
    align(state)
    const after = probe()
    expect(after.distanceTo(before)).toBeLessThan(0.5)
    expect(after.distanceTo(target)).toBeLessThan(before.distanceTo(target))
    expect(after.toArray().every(Number.isFinite)).toBe(true)
    const effects = createFightImpactScene({
      THREE,
      scene,
      initial: { ...state, impact: null },
      comfort: defaultFightComfort,
      figureOf: (side) => models[side].turns,
      geometry: (made) => made,
      glow,
    })
    effects.emit(state, 100)
    const spark = scene.getObjectByName('fight-contact-hit')!
    const expected = fightContactTarget(fightRigOf(rival), state.impact!.zone, facing)
    expect(spark.position.x).toBeCloseTo(expected.x, 9)
    expect(spark.position.y).toBeCloseTo(expected.y, 9)
    effects.dispose()

    expect(fightReplayHash(state)).toBe(hash)
  },
)

it.each(pairs)('%s / %s keeps an articulated falling body above the floor', (a, b) => {
  const { state, read } = contact([a, b])
  const context = read(state, 'opponent', { fighter: state.opponent, seconds: state.frame / 60 })
  const hit = context.physicalHit!
  const launch = physicalFallPose(hit, { progress: 0.2, grounded: false })
  const landed = physicalFallPose(hit, { progress: 0.8, grounded: true })
  expect(launch.leadKnee![0]).toBeGreaterThan(landed.rearKnee![0])
  expect(launch.leadElbow![0]).toBeLessThan(0)
  expect(landed.rearElbow![0]).toBeLessThan(0)
  for (const facing of [1, -1] as const) {
    const fighter = {
      ...state.opponent,
      pose: 'down' as const,
      attack: null,
      y: 0,
      facing,
      knockdownFrames: 60,
    }
    const model = buildFightFigure({ THREE, glow, fighter })
    new THREE.Scene().add(model.root)
    let floor = 0
    for (const progress of [0, 0.2, 0.5, 0.8]) {
      model.animate(1 + progress, 'idle', {
        transitionSeconds: 0,
        motion: fightBodyMotion({
          ...context,
          poseContinuity: undefined,
          fighter,
          seconds: 1 + progress,
          progress,
        }),
        afterMotion: (human) => {
          fightGroundContact(fighter)(human)
          floor = lowestBodyHeight(human)
        },
      })
      expect(floor).toBeCloseTo(0.012, 4)
    }
  }
})
