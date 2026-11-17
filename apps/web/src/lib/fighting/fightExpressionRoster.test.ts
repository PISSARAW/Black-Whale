import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { FIGHTING_ROSTER } from './roster'
import { createFightState } from './fightState'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { fightExpressionTarget, REST_FACE } from './fightExpressions'
import { FIGHT_EXPRESSION_PROFILES, fightExpressionProfile } from './fightExpressionProfiles'
import { drawFightFace, fightFaceRig, suspendFightExpression } from './fightExpressionRig'
import { fightReplayHash } from './fightReplayHash'
import { moveForSlot } from './movesets'
import { projectHanzo } from './hanzoProjection'
import { nativeExpressionMouth } from './fightExpressionFeatures'
import type { ArcadeFighter } from './types'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
const figure = (fighter: ArcadeFighter) => buildFightFigure({ THREE, glow, fighter })
function draw(model: ReturnType<typeof figure>, fighter: ArcadeFighter, seconds: number) {
  model.animate(seconds, 'idle', { motion: fightBodyMotion({ fighter, seconds, progress: 0.2 }) })
}
const hurt = (fighter: ArcadeFighter): ArcadeFighter => ({ ...fighter, pose: 'hit', hitStun: 12 })
function heavy(fighter: ArcadeFighter): ArcadeFighter {
  const move = moveForSlot(fighter.id, 'standingHeavy')!
  return {
    ...fighter,
    pose: 'heavy',
    attack: {
      kind: move.kind,
      variant: move.variant,
      moveId: move.id,
      frame: 2,
      impacted: false,
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
      projectileSpawned: false,
      reversal: false,
    },
  }
}
function geometryIds(root: THREE.Object3D) {
  const ids: string[] = []
  root.traverse((node) => {
    if (node instanceof THREE.Mesh) ids.push(node.geometry.uuid)
  })
  return ids.sort()
}

describe('all selectable fighters have authored emotions', () => {
  it('covers the actual roster explicitly, with forty distinct focus directions', () => {
    expect(Object.keys(FIGHT_EXPRESSION_PROFILES).sort()).toEqual(
      FIGHTING_ROSTER.map(({ id }) => id).sort(),
    )
    const poses = FIGHTING_ROSTER.map(({ id }) =>
      JSON.stringify(fightExpressionTarget(createFightState(id, 'phinks').player, 0).pose),
    )
    expect(new Set(poses).size).toBe(FIGHTING_ROSTER.length)
  })
  it.each(FIGHTING_ROSTER)(
    '$name: transitions, no new drawables, and no replay mutation',
    ({ id }) => {
      const state = createFightState(id, 'phinks')
      const fighter = state.player,
        model = figure(fighter),
        rig = fightFaceRig(model.root)!
      expect(rig).toBeDefined()
      expect(fightExpressionProfile(fighter)!.direction.length).toBeGreaterThan(15)
      const hash = fightReplayHash(state),
        ids = geometryIds(model.root)
      draw(model, fighter, 1)
      expect(rig.mode).toBe('concentration')
      draw(model, heavy(fighter), 2)
      expect(rig.mode).toBe('effort')
      expect(rig.pose!.effort).toBeGreaterThan(0)
      draw(model, hurt(heavy(fighter)), 2)
      expect(rig.mode).toBe('pain')
      expect(rig.pose!.pain).toBeGreaterThan(0)
      expect(rig.pose!.effort).toBe(0)
      expect(rig.pose!.smile).toBe(0)
      expect(Object.values(rig.pose!).every(Number.isFinite)).toBe(true)
      for (let tick = 1; tick <= 90; tick++) draw(model, fighter, 2 + tick / 60)
      expect(rig.pose!.pain).toBeLessThan(0.0001)
      expect(geometryIds(model.root)).toEqual(ids)
      expect(fightReplayHash(state)).toBe(hash)
    },
  )

  it('keeps Illumi’s black stare, eyebrows and mouth impassive after pain', () => {
    const fighter = createFightState('illumi', 'phinks').player,
      model = figure(fighter),
      rig = fightFaceRig(model.root)!
    draw(model, hurt(fighter), 1)
    expect(rig.mouth).toBeUndefined()
    for (const part of rig.eyes) expect(part.node.scale.y).toBe(part.scale)
    for (const part of rig.brows) {
      expect(part.node.position.y).toBe(part.y)
      expect(part.node.rotation.z).toBe(part.rotation)
    }
    for (const part of rig.pupils) expect(part.node.position.x).toBe(part.x)
  })
  it('keeps physical eye closure during Parallel Future', () => {
    const fighter = {
        ...createFightState('tserriednich', 'phinks').player,
        parallelEyesClosed: true,
      },
      model = figure(fighter)
    draw(model, hurt(fighter), 1)
    for (const part of fightFaceRig(model.root)!.eyes) expect(part.node.scale.y).toBeCloseTo(0.08)
  })
  it.each(['feitan', 'bonolenov'] as const)(
    '%s: never animates a mouth through its physical covering',
    (id) => {
      const fighter = createFightState(id, 'phinks').player,
        model = figure(fighter)
      draw(model, hurt(fighter), 1)
      const rig = fightFaceRig(model.root)!
      expect(rig.mouth).toBeUndefined()
      expect(rig.nativeMouth).toBeUndefined()
      expect(
        (model.root.getObjectByName('face-mouth') as THREE.Mesh).geometry.morphAttributes.position,
      ).toBeUndefined()
    },
  )
  it.each(['melody', 'gel', 'saiyu', 'luini', 'yokotani'] as const)(
    '%s: animates its native mouth and teeth as one coherent part',
    (id) => {
      const fighter = createFightState(id, 'phinks').player,
        model = figure(fighter),
        rig = fightFaceRig(model.root)!
      expect(rig.nativeMouth).toBeDefined()
      expect(rig.mouth).toBeUndefined()
      const original = model.root.getObjectByName('face-mouth')!
      const wasVisible = original.visible
      draw(model, hurt(fighter), 1)
      expect(original.visible).toBe(wasVisible)
      expect(rig.nativeMouth!.node.scale.y).not.toBe(1)
      const scale = rig.nativeMouth!.node.scale.clone()
      const restore = suspendFightExpression(model.root)
      expect(rig.nativeMouth!.node.scale.toArray()).toEqual([1, 1, 1])
      restore()
      expect(rig.nativeMouth!.node.scale.toArray()).toEqual(scale.toArray())
      drawFightFace(rig, REST_FACE)
      expect(rig.nativeMouth!.node.scale.toArray()).toEqual([1, 1, 1])
    },
  )
  it('keeps Yokotani’s visible closed lids instead of showing his hidden ordinary eyes', () => {
    const fighter = createFightState('yokotani', 'phinks').player,
      model = figure(fighter),
      rig = fightFaceRig(model.root)!
    draw(model, hurt(fighter), 1)
    expect(rig.eyes.map((part) => part.node.name)).toEqual([
      'yokotani-smiling-eyelid',
      'yokotani-smiling-eyelid',
    ])
    expect(model.root.getObjectByName('face-eye-left')!.visible).toBe(false)
    expect(model.root.getObjectByName('face-mouth')!.visible).toBe(false)
  })
  it('preserves Gel’s slit pupils and lipstick material', () => {
    const fighter = createFightState('gel', 'phinks').player,
      model = figure(fighter)
    const lips = model.root.getObjectByName('gel-lipstick') as THREE.Mesh,
      material = lips.material
    draw(model, hurt(fighter), 1)
    expect(lips.material).toBe(material)
    expect(model.root.getObjectByName('gel-slit-pupil')).toBeDefined()
  })
  it('keeps Hanzo’s projected mouth as translucent as his native face', () => {
    const fighter = projectHanzo(createFightState('hanzo', 'phinks').player),
      model = figure(fighter)
    const rig = fightFaceRig(model.root)!
    draw(model, heavy(fighter), 1)
    expect((rig.mouth!.material as THREE.MeshBasicMaterial).opacity).toBeCloseTo(0.28)
  })
  it('gives Biscuit’s natural form a restrained expression and a correctly fitted mouth cache', () => {
    const compact = createFightState('biscuit', 'phinks').player,
      natural = { ...compact, biscuitTrueForm: true }
    expect(fightExpressionProfile(compact)!.smile).toBeGreaterThan(
      fightExpressionProfile(natural)!.smile,
    )
    const a = figure(compact),
      b = figure(natural)
    expect(fightFaceRig(a.root)!.mouth!.geometry).not.toBe(fightFaceRig(b.root)!.mouth!.geometry)
  })
  it('leaves Melody’s flute contact to her authored pose', () => {
    const fighter = {
      ...createFightState('melody', 'phinks').player,
      melodyPerformance: {
        originX: 45,
        startupFrames: 0,
        playingFrames: 120,
        moveId: 'melody:neutralSpecial',
      },
    }
    const target = fightExpressionTarget(fighter, 0).pose
    expect([
      target.headYaw,
      target.headPitch,
      target.shoulder,
      target.effort,
      target.smile,
    ]).toEqual([0, 0, 0, 0, 0])
  })
})

describe('native expression geometry ownership', () => {
  it('preserves world positions when grouping lips and teeth under a transformed head', () => {
    const head = new THREE.Group()
    head.position.set(1, 2, 3)
    head.rotation.set(0.1, 0.4, -0.2)
    head.scale.set(1.1, 1.2, 0.8)
    const parts = ['yokotani-wide-smile', 'yokotani-smile-teeth'].map((name, index) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.01), glow(0xeeeeee, 1))
      mesh.name = name
      mesh.position.set(0.01, -0.11 + index * 0.003, 0.18 + index * 0.002)
      head.add(mesh)
      return mesh
    })
    const before = parts.map((part) => part.getWorldPosition(new THREE.Vector3()))
    const ids = geometryIds(head)
    nativeExpressionMouth({ THREE, head })
    parts.forEach((part, index) =>
      expect(part.getWorldPosition(new THREE.Vector3()).distanceTo(before[index])).toBeLessThan(
        1e-12,
      ),
    )
    expect(geometryIds(head)).toEqual(ids)
  })
  it('never shares a native mouth pivot or expression between two actors', () => {
    const fighter = createFightState('gel', 'phinks').player
    const a = figure(fighter),
      b = figure(fighter)
    const first = fightFaceRig(a.root)!,
      second = fightFaceRig(b.root)!
    expect(first.nativeMouth!.node).not.toBe(second.nativeMouth!.node)
    expect((a.root.getObjectByName('gel-lipstick') as THREE.Mesh).geometry).toBe(
      (b.root.getObjectByName('gel-lipstick') as THREE.Mesh).geometry,
    )
    draw(a, hurt(fighter), 1)
    draw(b, fighter, 1)
    expect(first.nativeMouth!.node.scale.y).not.toBe(second.nativeMouth!.node.scale.y)
  })
})
