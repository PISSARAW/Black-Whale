import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAttack, tickFight } from '../engine'
import { buildFightFigure } from '../fighterFigure'
import { fightFaceRig } from '../fightExpressionRig'
import { fightReplayHash } from '../fightReplayHash'
import { EMPTY_INPUT, type FightInput, type FightState } from '../types'
import { createKameoScene } from './scene'
import { withKameos } from './state'
import { tubeppaAnimation } from './tubeppaMotion'
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
      { player: 'tubeppa' },
    ),
  )
  return {
    ...state,
    player: { ...state.player, x: 20, health: 200 },
    opponent: { ...state.opponent, x: 70 },
  }
}
const tick = (state: FightState, input: FightInput = EMPTY_INPUT) =>
  tickFight(state, input, {
    dt: 1 / 60,
    opponentInput: EMPTY_INPUT,
    ai: false,
  })
function geometryIds(model: ReturnType<typeof buildFightFigure>) {
  const ids: string[] = []
  model.root.traverse((node) => {
    if (node instanceof THREE.Mesh) ids.push(node.geometry.uuid)
  })
  return ids
}
function sceneFixture() {
  const scene = new THREE.Scene()
  let model: ReturnType<typeof buildFightFigure> | undefined
  const kameos = createKameoScene({
    scene,
    worldX: (x) => x,
    buildFighter: (fighter) => {
      model = buildFightFigure({ THREE, glow, fighter })
      return model
    },
  })
  return {
    kameos,
    get model() {
      return model!
    },
  }
}

describe('Tubeppa uses roster articulation and expressions in the real kameo scene', () => {
  it('follows the complete support cycle and its real healing frame without mutating the replay', () => {
    let state = tick(duel(), { ...EMPTY_INPUT, kameo: true })
    const fixture = sceneFixture()
    fixture.kameos.sync(state, 0)
    const model = fixture.model
    const ids = geometryIds(model)
    const face = fightFaceRig(model.root)!
    const shoulders = new Map<string, number>()
    const modes = new Set<string>()
    for (let frame = 0; frame < 75; frame++) {
      const hash = fightReplayHash(state)
      fixture.kameos.sync(state, frame / 60)
      expect(fightReplayHash(state)).toBe(hash)
      const slot = slotOf(state)
      shoulders.set(
        `${slot.phase}:${slot.phaseFrames}`,
        model.root.getObjectByName('shoulder-right')!.rotation.x,
      )
      modes.add(face.mode)
      if (slot.phase === 'acting' && slot.phaseFrames === 12) {
        expect(state.player.health).toBe(208)
        expect(face.mode).toBe('effort')
        expect(face.pose!.effort).toBeGreaterThan(0.4)
      }
      state = tick(state)
    }
    expect(slotOf(state).phase).toBe('reserve')
    expect(model.root.visible).toBe(false)
    expect(state.player.health).toBe(208)
    expect(modes).toEqual(new Set(['concentration', 'effort']))
    expect(shoulders.get('entering:9')).not.toBe(shoulders.get('acting:12'))
    expect(geometryIds(model)).toEqual(ids)
    expect(
      model.root.getObjectByName('fight-chest')!.getObjectByName('tubeppa-suit-piping'),
    ).toBeTruthy()
    fixture.kameos.dispose()
    expect(model.root.parent).toBeNull()
  })

  it('lets an actual received hit interrupt the support gesture and facial effort immediately', () => {
    let state = duel()
    state.opponent.x = 34
    state = tick(state, { ...EMPTY_INPUT, kameo: true, right: true })
    state = performAttack(state, 'opponent', 'heavy')
    const fixture = sceneFixture()
    for (let frame = 0; frame < 40; frame++) {
      fixture.kameos.sync(state, frame / 60)
      if (slotOf(state).fighter.hitStun > 0) break
      state = tick(state)
    }
    expect(slotOf(state).fighter.health).toBeLessThan(slotOf(state).fighter.maxHealth)
    const face = fightFaceRig(fixture.model.root)!
    expect(face.mode).toBe('pain')
    expect(face.pose!.pain).toBeGreaterThan(0.3)
    expect(face.pose!.effort).toBe(0)
    expect(face.pose!.smile).toBe(0)
    expect(state.player.health).toBe(200)
    fixture.kameos.dispose()
  })

  it.each([1, -1] as const)(
    'keeps face accessories, grounded feet and independent facial weights facing %s',
    (facing) => {
      const slot: KameoSlot = { ...slotOf(duel()), phase: 'acting', phaseFrames: 12 }
      slot.fighter = { ...slot.fighter, facing }
      const model = buildFightFigure({ THREE, glow, fighter: slot.fighter })
      const other = buildFightFigure({ THREE, glow, fighter: slot.fighter })
      const face = fightFaceRig(model.root)!,
        second = fightFaceRig(other.root)!
      expect(face.mouth!.geometry).toBe(second.mouth!.geometry)
      expect(face.mouth!.morphTargetInfluences).not.toBe(second.mouth!.morphTargetInfluences)
      const glasses = model.root.getObjectByName('signature:glasses-thin')!
      const local = glasses.matrix.clone()
      for (let frame = 0; frame < 120; frame++) {
        model.animate(frame / 60, 'idle', tubeppaAnimation(slot, frame / 60))
        model.root.updateMatrixWorld(true)
        const foot = new THREE.Vector3()
        const heights = ['left', 'right'].map(
          (side) =>
            model.root.worldToLocal(
              model.root.getObjectByName(`knee-${side}`)!.children[1].getWorldPosition(foot),
            ).y,
        )
        expect(Math.abs(Math.min(...heights))).toBeLessThan(0.12)
        expect(glasses.matrix.equals(local)).toBe(true)
        expect(Object.values(face.pose!).every(Number.isFinite)).toBe(true)
      }
      expect(second.pose).toBeNull()
      expect(model.root.getObjectByName('signature:earrings')).toBeTruthy()
      const beforeSeek = model.root.getObjectByName('shoulder-right')!.rotation.x
      model.animate(0, 'idle', tubeppaAnimation(slot, 0))
      expect(model.root.getObjectByName('shoulder-right')!.rotation.x).toBeCloseTo(beforeSeek, 2)
      expect(face.mode).toBe('effort')
      const entering: KameoSlot = { ...slot, phase: 'entering', phaseFrames: 9 }
      model.animate(1, 'idle', tubeppaAnimation(entering, 1))
      const head = model.root.getObjectByName('manga-head:prince-tubeppa')!
      const target = head.localToWorld(new THREE.Vector3(0.116, -0.025, 0.214))
      const palm = model.root.getObjectByName('hand-right')!.getWorldPosition(new THREE.Vector3())
      expect(palm.distanceTo(target)).toBeLessThan(0.005)
    },
  )

  it('returns from pain to concentration and keeps a dead Tubeppa fallen until the round ends', () => {
    const state = duel(),
      fixture = sceneFixture()
    let slot = { ...slotOf(state), phase: 'acting' as KameoSlot['phase'], phaseFrames: 12 }
    slot.fighter = { ...slot.fighter, pose: 'hit', hitStun: 12 }
    state.kameos!.player = slot
    fixture.kameos.sync(state, 0)
    slot = { ...slot, phase: 'leaving', fighter: { ...slot.fighter, pose: 'idle', hitStun: 0 } }
    state.kameos!.player = slot
    for (let frame = 1; frame < 100; frame++) fixture.kameos.sync(state, frame / 60)
    const face = fightFaceRig(fixture.model.root)!
    expect(face.mode).toBe('concentration')
    expect(face.pose!.pain).toBeLessThan(0.0001)
    slot = {
      ...slot,
      phase: 'eliminated',
      eliminatedRound: state.roundNumber,
      fighter: { ...slot.fighter, health: 0 },
    }
    state.kameos!.player = slot
    fixture.kameos.sync(state, 3)
    expect(face.mode).toBe('pain')
    expect(face.pose!.eye).toBeCloseTo(0.1, 1)
    fixture.kameos.sync({ ...state, frame: state.frame + 42 }, 3.7)
    expect(Math.abs(fixture.model.root.children[0].rotation.x)).toBeGreaterThan(1)
    fixture.kameos.sync({ ...state, roundNumber: state.roundNumber + 1 }, 4)
    expect(fixture.model.root.visible).toBe(false)
    fixture.kameos.dispose()
  })
})
