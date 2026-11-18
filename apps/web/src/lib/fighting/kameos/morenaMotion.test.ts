import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAttack, tickFight } from '../engine'
import { buildFightFigure } from '../fighterFigure'
import { fightFaceRig } from '../fightExpressionRig'
import { fightReplayHash } from '../fightReplayHash'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { fightRigOf, footHeight } from '../fightRig'
import { EMPTY_INPUT, type FightInput, type FightState } from '../types'
import { createKameoScene } from './scene'
import { withKameos } from './state'
import { morenaAnimation } from './morenaMotion'
import { morenaHairMotion } from './morenaHairMotion'
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
      { player: 'morena' },
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

describe('Morena support choreography and facial expressions', () => {
  it('uses the real Contagion frame and a complete call cycle without changing replay state or geometry', () => {
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
        expect(state.opponent.hatsuEffects.contagionStacks).toBe(0)
      if (slot.phase === 'acting' && slot.phaseFrames === 12) {
        expect(state.opponent.hatsuEffects.contagionStacks).toBe(1)
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
      model.root.getObjectByName('fight-chest')!.getObjectByName('morena-fitted-bodice'),
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
    expect(state.opponent.hatsuEffects.contagionStacks).toBe(0)
    view.bodies.dispose()
  })

  it.each([1, -1] as const)(
    'keeps the slim adult rig planted, clothing articulated and mouth stable facing %s',
    (facing) => {
      const slot: KameoSlot = { ...slotOf(duel()), phase: 'acting', phaseFrames: 12 }
      slot.fighter = { ...slot.fighter, facing }
      const model = build(slot.fighter),
        other = build(slot.fighter)
      const face = fightFaceRig(model.root)!,
        second = fightFaceRig(other.root)!
      const mouth = face.mouth!
      expect(mouth.geometry).toBe(second.mouth!.geometry)
      expect(mouth.morphTargetInfluences).not.toBe(second.mouth!.morphTargetInfluences)
      const topology = [...mouth.geometry.index!.array]
      const base = [...mouth.geometry.getAttribute('position').array]
      const marks = [
        model.root.getObjectByName('morena-thorn-crown')!,
        model.root.getObjectByName('morena-left-ear-piercings')!,
        model.root.getObjectByName('morena-scar')!,
      ]
      const nativeMarks = marks.map((node) => node.matrix.clone())
      for (let frame = 0; frame < 90; frame++) {
        model.animate(frame / 60, 'idle', morenaAnimation(slot, frame / 60))
        const human = humanAnimationRig(model.turns)!
        expect(Math.abs(footHeight(fightRigOf(human)))).toBeLessThan(0.1)
        expect(
          human.arms.every((arm) => arm.getObjectByName('morena-off-shoulder-sleeve-edge')),
        ).toBe(true)
        expect(human.knees.every((knee) => knee.getObjectByName('morena-black-boot'))).toBe(true)
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
      model.animate(0, 'idle', morenaAnimation(slot, 0))
      expect(face.mode).toBe('effort')
      expect(face.pose!.pain).toBe(0)
      expect(face.pose!.effort).toBeCloseTo(0.5984)
      const handAngle = model.root.getObjectByName('shoulder-right')!.rotation.x
      const salute = { ...slot, phase: 'entering' as const, phaseFrames: 9 }
      model.animate(1, 'idle', morenaAnimation(salute, 1))
      expect(model.root.getObjectByName('shoulder-right')!.rotation.x).not.toBe(handAngle)
      model.root.updateMatrixWorld(true)
      const human = humanAnimationRig(model.turns)!
      const lips = human.head.localToWorld(new THREE.Vector3(0.032, -0.103, 0.215))
      const hand = fightRigOf(human).wrists[1].getWorldPosition(new THREE.Vector3())
      expect(hand.distanceTo(lips)).toBeLessThan(0.035)
    },
  )

  it('shares cached hair deformation with independent weights and an anchored scalp', () => {
    const slot: KameoSlot = { ...slotOf(duel()), phase: 'acting', phaseFrames: 12 }
    const model = build(slot.fighter),
      other = build(slot.fighter)
    model.animate(0, 'idle', morenaAnimation(slot, 0))
    other.animate(0, 'idle', { afterMotion: morenaHairMotion(slot, 0) })
    const hair = model.root.getObjectByName('manga-layered-hair')!.children[1] as THREE.Mesh
    const second = other.root.getObjectByName('manga-layered-hair')!.children[1] as THREE.Mesh
    const geometry = hair.geometry
    const base = [...geometry.getAttribute('position').array]
    const weights = second.morphTargetInfluences!.slice()
    expect(geometry).toBe(second.geometry)
    expect(hair.morphTargetInfluences).not.toBe(second.morphTargetInfluences)
    model.animate(1, 'idle', morenaAnimation(slot, 1))
    expect(hair.morphTargetInfluences).not.toEqual(weights)
    expect(second.morphTargetInfluences).toEqual(weights)
    expect(hair.geometry).toBe(geometry)
    expect([...geometry.getAttribute('position').array]).toEqual(base)
    const positions = geometry.getAttribute('position')
    for (const target of geometry.morphAttributes.position!) {
      expect([...target.array].every(Number.isFinite)).toBe(true)
      for (let i = 0; i < positions.count; i++)
        if (positions.getY(i) >= -0.18)
          expect(target.getX(i) + target.getY(i) + target.getZ(i)).toBe(0)
    }
    const snapshot = hair.morphTargetInfluences!.slice()
    model.animate(0, 'idle', morenaAnimation(slot, 0))
    model.animate(1, 'idle', morenaAnimation(slot, 1))
    expect(hair.morphTargetInfluences).toEqual(snapshot)
    const dead = { ...slot, phase: 'eliminated' as const, fighter: { ...slot.fighter, health: 0 } }
    model.animate(2, 'idle', morenaAnimation(dead, 2))
    expect(hair.morphTargetInfluences!.every((weight) => weight === 0)).toBe(true)
  })

  it('returns to calm and leaves a fallen Morena fallen until the end of the round', () => {
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
