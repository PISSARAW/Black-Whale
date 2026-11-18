import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAttack, tickFight } from '../engine'
import { buildFightFigure } from '../fighterFigure'
import { fightFaceRig, suspendFightExpression } from '../fightExpressionRig'
import { fightReplayHash } from '../fightReplayHash'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { fightRigOf, footHeight } from '../fightRig'
import { EMPTY_INPUT, type FightInput, type FightState } from '../types'
import { createKameoScene } from './scene'
import { withKameos } from './state'
import { salesaleAnimation } from './salesaleMotion'
import type { KameoSlot } from './types'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({
    color,
    opacity,
    transparent: opacity < 1,
  })
const slotOf = (state: FightState) => state.kameos!.player!
function duel() {
  const state = beginFight(
    withKameos(
      createFight('kurapika', 'hisoka', {
        mode: 'versus-local',
      }),
      { player: 'salesale' },
    ),
  )
  return { ...state, player: { ...state.player, x: 20 }, opponent: { ...state.opponent, x: 30 } }
}
const tick = (state: FightState, input: FightInput = EMPTY_INPUT) =>
  tickFight(state, input, {
    dt: 1 / 60,
    opponentInput: EMPTY_INPUT,
    ai: false,
  })
const build = (fighter: KameoSlot['fighter']) => buildFightFigure({ THREE, glow, fighter })
function geometryIds(model: ReturnType<typeof build>) {
  const ids: string[] = []
  model.root.traverse((node) => {
    if (node instanceof THREE.Mesh) ids.push(node.geometry.uuid)
  })
  return ids
}
function fixture() {
  const scene = new THREE.Scene()
  let model: ReturnType<typeof build>
  const bodies = createKameoScene({
    scene,
    worldX: (x) => x,
    buildFighter: (fighter) => {
      model = build(fighter)
      return model
    },
  })
  return {
    bodies,
    get model() {
      return model
    },
  }
}

function deformedVertices(mesh: THREE.Mesh) {
  const geometry = mesh.geometry,
    source = geometry.getAttribute('position')
  return Array.from({ length: source.count }, (_, i) => {
    const point = new THREE.Vector3().fromBufferAttribute(source, i)
    geometry.morphAttributes.position!.forEach((target, kind) => {
      point.addScaledVector(
        new THREE.Vector3().fromBufferAttribute(target, i),
        mesh.morphTargetInfluences![kind],
      )
    })
    return point.setZ(0)
  })
}

function expectTeethContained(mouth: THREE.Mesh, teeth: THREE.Mesh) {
  const vertices = deformedVertices(mouth),
    index = mouth.geometry.index!,
    triangles: THREE.Triangle[] = []
  for (let i = 0; i < index.count; i += 3)
    triangles.push(
      new THREE.Triangle(
        vertices[index.getX(i)],
        vertices[index.getX(i + 1)],
        vertices[index.getX(i + 2)],
      ),
    )
  for (const point of deformedVertices(teeth))
    expect(triangles.some((triangle) => triangle.containsPoint(point))).toBe(true)
}

describe('Salé-salé support choreography and facial expressions', () => {
  it('uses the real smoke-delivery frame and a complete call cycle without changing replay state or geometry', () => {
    let state = tick(duel(), { ...EMPTY_INPUT, kameo: true })
    const view = fixture()
    view.bodies.sync(state, 0)
    const model = view.model,
      face = fightFaceRig(model.root)!,
      ids = geometryIds(model)
    const poses = new Map<string, number>()
    for (let frame = 0; frame < 75; frame++) {
      const hash = fightReplayHash(state)
      view.bodies.sync(state, frame / 60)
      expect(fightReplayHash(state)).toBe(hash)
      const slot = slotOf(state)
      poses.set(
        `${slot.phase}:${slot.phaseFrames}`,
        model.root.getObjectByName('shoulder-right')!.rotation.x,
      )
      if (slot.phase === 'acting' && slot.phaseFrames === 11)
        expect(state.opponent.hatsuEffects.smokeFrames).toBe(0)
      if (slot.phase === 'acting' && slot.phaseFrames === 12) {
        expect(state.opponent.hatsuEffects.smokeFrames).toBeGreaterThan(0)
        expect(face.mode).toBe('effort')
        expect(face.pose!.effort).toBeGreaterThan(0.4)
      }
      state = tick(state)
    }
    expect(slotOf(state).phase).toBe('reserve')
    expect(model.root.visible).toBe(false)
    expect(poses.get('entering:9')).not.toBe(poses.get('acting:12'))
    expect(geometryIds(model)).toEqual(ids)
    expect(
      model.root.getObjectByName('fight-chest')!.getObjectByName('salesale-wrapped-lapel'),
    ).toBeTruthy()
    view.bodies.dispose()
    expect(model.root.parent).toBeNull()
  })

  it('interrupts the gesture and effort immediately after a real received strike', () => {
    let state = duel()
    state.opponent.x = 34
    state = performAttack(
      tick(state, { ...EMPTY_INPUT, kameo: true, right: true }),
      'opponent',
      'heavy',
    )
    const view = fixture()
    for (let frame = 0; frame < 40; frame++) {
      view.bodies.sync(state, frame / 60)
      if (slotOf(state).fighter.hitStun > 0) break
      state = tick(state)
    }
    expect(slotOf(state).fighter.health).toBeLessThan(slotOf(state).fighter.maxHealth)
    const face = fightFaceRig(view.model.root)!
    expect(face.mode).toBe('pain')
    expect(face.pose!.pain).toBeGreaterThan(0.4)
    expect(face.pose!.effort).toBe(0)
    expect(face.pose!.smile).toBe(0)
    expect(state.opponent.hatsuEffects.smokeFrames).toBe(0)
    view.bodies.dispose()
  })

  it.each([1, -1] as const)(
    'keeps the broad adult rig planted, clothing articulated and mouth stable facing %s',
    (facing) => {
      const slot: KameoSlot = { ...slotOf(duel()), phase: 'acting', phaseFrames: 12 }
      slot.fighter = { ...slot.fighter, facing }
      const model = build(slot.fighter),
        other = build(slot.fighter)
      const face = fightFaceRig(model.root)!,
        second = fightFaceRig(other.root)!
      const mouth = face.mouth!
      const teeth = mouth.getObjectByName('salesale-smile-teeth') as THREE.Mesh
      expect(mouth.geometry).toBe(second.mouth!.geometry)
      expect(mouth.morphTargetInfluences).not.toBe(second.mouth!.morphTargetInfluences)
      const topology = [...mouth.geometry.index!.array]
      const base = [...mouth.geometry.getAttribute('position').array]
      const marks = [
        model.root.getObjectByName('salesale-right-ear-piercings')!,
        model.root.getObjectByName('salesale-cheek-and-chin-folds')!,
      ]
      const nativeMarks = marks.map((node) => {
        node.updateMatrix()
        return node.matrix.clone()
      })
      for (let frame = 0; frame < 90; frame++) {
        model.animate(frame / 60, 'idle', salesaleAnimation(slot, frame / 60))
        const human = humanAnimationRig(model.turns)!
        expect(Math.abs(footHeight(fightRigOf(human)))).toBeLessThan(0.1)
        expect(human.arms.every((arm) => arm.getObjectByName('salesale-robe-cuff'))).toBe(true)
        expect(human.knees.every((knee) => knee.getObjectByName('salesale-boot-shaft'))).toBe(true)
        expect(teeth.morphTargetInfluences).toEqual(mouth.morphTargetInfluences)
        marks.forEach((node, index) => {
          node.updateMatrix()
          expect(node.matrix.equals(nativeMarks[index])).toBe(true)
        })
        expect(Object.values(face.pose!).every(Number.isFinite)).toBe(true)
      }
      expect([...mouth.geometry.getAttribute('position').array]).toEqual(base)
      expect([...mouth.geometry.index!.array]).toEqual(topology)
      expect(mouth.geometry.morphAttributes.position).toHaveLength(3)
      for (const target of mouth.geometry.morphAttributes.position!)
        expect([...target.array].every(Number.isFinite)).toBe(true)
      expect(second.pose).toBeNull()
      model.animate(0, 'idle', salesaleAnimation(slot, 0))
      expect(face.mode).toBe('effort')
      expect(face.pose!.pain).toBe(0)
      expect(face.pose!.effort).toBeCloseTo(0.799)
      const handAngle = model.root.getObjectByName('shoulder-right')!.rotation.x
      const salute = { ...slot, phase: 'entering' as const, phaseFrames: 9 }
      model.animate(1, 'idle', salesaleAnimation(salute, 1))
      expect(model.root.getObjectByName('shoulder-right')!.rotation.x).not.toBe(handAngle)
    },
  )

  it('keeps teeth inside the native mouth, with independent cached morphs and cinematic restoration', () => {
    const slot: KameoSlot = { ...slotOf(duel()), phase: 'acting', phaseFrames: 12 }
    const model = build(slot.fighter),
      other = build(slot.fighter)
    const mouth = fightFaceRig(model.root)!.mouth!,
      teeth = mouth.getObjectByName('salesale-smile-teeth') as THREE.Mesh
    const second = fightFaceRig(other.root)!.mouth!.getObjectByName(
      'salesale-smile-teeth',
    ) as THREE.Mesh
    const geometry = teeth.geometry,
      base = [...geometry.getAttribute('position').array]
    model.animate(0, 'idle', salesaleAnimation(slot, 0))
    const ids = geometryIds(model)
    expect(geometry).toBe(second.geometry)
    expect(teeth.morphTargetInfluences).not.toBe(second.morphTargetInfluences)
    for (const [index, state] of [
      { ...slot, phase: 'entering' as const, phaseFrames: 0 },
      slot,
      { ...slot, fighter: { ...slot.fighter, hitStun: 12, pose: 'hit' as const } },
    ].entries()) {
      model.animate(index, 'idle', salesaleAnimation(state, index))
      expect(teeth.morphTargetInfluences).toEqual(mouth.morphTargetInfluences)
      expectTeethContained(mouth, teeth)
    }
    const weights = mouth.morphTargetInfluences!.slice()
    const restore = suspendFightExpression(model.root)
    expect(teeth.morphTargetInfluences).toEqual([0, 0, 0])
    expect(mouth.morphTargetInfluences).toEqual([0, 0, 0])
    restore()
    expect(teeth.morphTargetInfluences).toEqual(weights)
    expect(mouth.morphTargetInfluences).toEqual(weights)
    expect(second.morphTargetInfluences).toEqual([0, 0, 0])
    expect(teeth.geometry).toBe(geometry)
    expect([...geometry.getAttribute('position').array]).toEqual(base)
    expect(geometryIds(model)).toEqual(ids)
  })

  it('returns to calm and leaves the fallen body until the end of the round', () => {
    const state = duel(),
      view = fixture()
    let slot: KameoSlot = { ...slotOf(state), phase: 'acting', phaseFrames: 12 }
    slot.fighter = { ...slot.fighter, hitStun: 12, pose: 'hit' }
    state.kameos!.player = slot
    view.bodies.sync(state, 0)
    const face = fightFaceRig(view.model.root)!
    expect(face.mode).toBe('pain')
    slot = { ...slot, phase: 'leaving', fighter: { ...slot.fighter, hitStun: 0, pose: 'idle' } }
    state.kameos!.player = slot
    for (let frame = 1; frame < 100; frame++) view.bodies.sync(state, frame / 60)
    expect(face.mode).toBe('concentration')
    expect(face.pose!.pain).toBeLessThan(0.0001)
    slot = {
      ...slot,
      phase: 'eliminated',
      eliminatedRound: state.roundNumber,
      fighter: { ...slot.fighter, health: 0 },
    }
    state.kameos!.player = slot
    view.bodies.sync(state, 2)
    view.bodies.sync({ ...state, frame: state.frame + 42 }, 2.7)
    expect(face.mode).toBe('pain')
    expect(face.pose!.eye).toBeCloseTo(0.1)
    expect(Math.abs(view.model.turns.rotation.x)).toBeGreaterThan(1)
    view.bodies.sync({ ...state, roundNumber: state.roundNumber + 1 }, 3)
    expect(view.model.root.visible).toBe(false)
    view.bodies.dispose()
  })
})
