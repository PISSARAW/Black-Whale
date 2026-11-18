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
import { zhangLeiAnimation } from './zhangLeiMotion'
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
      { player: 'zhanglei' },
    ),
  )
  return { ...state, player: { ...state.player, x: 20 }, opponent: { ...state.opponent, x: 70 } }
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

describe('Zhang Lei support choreography and facial expressions', () => {
  it('uses the real coin-bonus frame and a complete call cycle without changing replay state or geometry', () => {
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
        expect(state.player.hatsuEffects.coinCharges).toBe(0)
      if (slot.phase === 'acting' && slot.phaseFrames === 12) {
        expect(state.player.hatsuEffects.coinCharges).toBe(1)
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
      model.root.getObjectByName('fight-chest')!.getObjectByName('zhanglei-dark-bib'),
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
    expect(state.player.hatsuEffects.coinCharges).toBe(0)
    view.bodies.dispose()
  })

  it.each([1, -1] as const)(
    'keeps the short adult rig planted, clothing articulated and mouth stable facing %s',
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
        model.root.getObjectByName('zhanglei-six-forehead-dots')!,
        model.root.getObjectByName('signature:moustache')!,
      ]
      const nativeMarks = marks.map((node) => node.matrix.clone())
      for (let frame = 0; frame < 90; frame++) {
        model.animate(frame / 60, 'idle', zhangLeiAnimation(slot, frame / 60))
        const human = humanAnimationRig(model.turns)!
        expect(Math.abs(footHeight(fightRigOf(human)))).toBeLessThan(0.1)
        expect(human.legs.every((leg) => leg.getObjectByName('zhanglei-baggy-trouser-thigh'))).toBe(
          true,
        )
        expect(human.knees.every((knee) => knee.getObjectByName('zhanglei-trouser-fold'))).toBe(
          true,
        )
        for (const part of face.brows) {
          expect(Math.abs(part.node.position.y - part.y)).toBeLessThan(0.01)
          expect(Math.abs(part.node.rotation.z - part.rotation)).toBeLessThan(0.08)
        }
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
      model.animate(0, 'idle', zhangLeiAnimation(slot, 0))
      expect(face.mode).toBe('effort')
      expect(face.pose!.pain).toBe(0)
      expect(face.pose!.effort).toBeCloseTo(0.5184)
      const handAngle = model.root.getObjectByName('shoulder-right')!.rotation.x
      const salute = { ...slot, phase: 'entering' as const, phaseFrames: 9 }
      model.animate(1, 'idle', zhangLeiAnimation(salute, 1))
      expect(model.root.getObjectByName('shoulder-right')!.rotation.x).not.toBe(handAngle)
    },
  )

  it('returns to calm and leaves a dead prince fallen until the end of the round', () => {
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
