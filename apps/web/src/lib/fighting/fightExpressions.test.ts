import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from './fighterFigure'
import { createFightState } from './fightState'
import { fightBodyMotion } from './fightBodyMotion'
import { fightExpressionTarget } from './fightExpressions'
import { fightFaceRig, suspendFightExpression } from './fightExpressionRig'
import { fightReplayHash } from './fightReplayHash'
import { moveForSlot } from './movesets'
import { BASELINE_FIGHTERS } from './combatBaseline'
import type { ArcadeFighter, FighterId } from './types'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
const figure = (fighter: ArcadeFighter) => buildFightFigure({ THREE, glow, fighter })
function attack(fighter: ArcadeFighter): ArcadeFighter {
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
function draw(model: ReturnType<typeof figure>, fighter: ArcadeFighter, seconds: number) {
  model.animate(seconds, 'idle', { motion: fightBodyMotion({ fighter, seconds, progress: 0.2 }) })
}
const hurt = (fighter: ArcadeFighter): ArcadeFighter => ({ ...fighter, pose: 'hit', hitStun: 12 })

describe('the six fighters express combat through their existing face', () => {
  it.each(BASELINE_FIGHTERS)(
    '%s: focus, effort and received pain use the real body motion',
    (id) => {
      const fighter = createFightState(id, 'hisoka').player
      const model = figure(fighter)
      const rig = fightFaceRig(model.turns)!
      expect(rig.eyes).toHaveLength(2)
      expect(rig.brows).toHaveLength(2)
      draw(model, fighter, 1)
      const focusedEye = rig.eyes[0].node.scale.y
      draw(model, attack(fighter), 2)
      expect(rig.mode).toBe('effort')
      expect(rig.pose!.effort).toBeGreaterThan(0.4)
      expect(rig.eyes[0].node.scale.y).toBeLessThan(focusedEye)
      draw(model, hurt(attack(fighter)), 2)
      expect(rig.mode).toBe('pain')
      expect(rig.pose!.pain).toBeGreaterThan(0.4)
      expect(rig.pose!.effort).toBe(0)
      expect(rig.pose!.smile).toBe(0)
      for (let frame = 1; frame <= 90; frame++) draw(model, fighter, 2 + frame / 60)
      expect(rig.mode).toBe('concentration')
      expect(rig.eyes[0].node.scale.y).toBeCloseTo(focusedEye, 4)
      expect(rig.pose!.pain).toBeLessThan(0.0001)
      expect(rig.pose!.effort).toBeLessThan(0.0001)
    },
  )

  it('gives the six fighters distinct expressions and keeps Chrollo restrained', () => {
    const targets = BASELINE_FIGHTERS.map(
      (id) => fightExpressionTarget(createFightState(id, 'hisoka').player, 0).pose,
    )
    expect(new Set(targets.map((pose) => JSON.stringify(pose))).size).toBe(6)
    expect(targets[2].smile).toBeGreaterThan(targets[5].smile)
    const chrollo = fightExpressionTarget(hurt(createFightState('chrollo', 'hisoka').player), 0)
    const kurapika = fightExpressionTarget(hurt(createFightState('kurapika', 'hisoka').player), 0)
    expect(chrollo.pose.pain).toBeLessThan(kurapika.pose.pain)
  })

  it('follows recovery and wake-up rather than holding effort or pain indefinitely', () => {
    const fighter = attack(createFightState('kurapika', 'hisoka').player)
    const early = fightExpressionTarget(fighter, 0).pose.effort
    fighter.attack!.frame = 200
    expect(fightExpressionTarget(fighter, 0).pose.effort).toBeLessThan(early)
    expect(fightExpressionTarget({ ...fighter, attack: null, pose: 'wakeup' }, 1).pose.pain).toBe(0)
  })

  it('leaves Feitan’s covered mouth untouched and creates no extra facial drawables', () => {
    const fighter = createFightState('feitan', 'hisoka').player
    const model = figure(fighter)
    expect(fightFaceRig(model.root)!.mouth).toBeUndefined()
    const mouth = model.root.getObjectByName('face-mouth') as THREE.Mesh
    expect(mouth.geometry.morphAttributes.position).toBeUndefined()
  })

  it.each(BASELINE_FIGHTERS.filter((id) => id !== 'feitan'))(
    '%s: shares cached morph geometry but never the facial weights of another actor',
    (id) => {
      const fighter = createFightState(id, 'hisoka').player
      const a = figure(fighter),
        b = figure(fighter)
      const first = fightFaceRig(a.root)!,
        second = fightFaceRig(b.root)!
      expect(first.mouth!.geometry).toBe(second.mouth!.geometry)
      expect(first.mouth!.morphTargetInfluences).not.toBe(second.mouth!.morphTargetInfluences)
      const original = Array.from(first.mouth!.geometry.attributes.position.array)
      draw(a, hurt(fighter), 1)
      draw(b, fighter, 1)
      expect(first.mouth!.morphTargetInfluences![1]).toBeGreaterThan(0.5)
      expect(second.mouth!.morphTargetInfluences![1]).toBe(0)
      expect(Array.from(first.mouth!.geometry.attributes.position.array)).toEqual(original)
      for (const target of first.mouth!.geometry.morphAttributes.position!)
        expect(Array.from(target.array).every(Number.isFinite)).toBe(true)
      expect(first.mouth!.geometry.boundingSphere!.radius).toBeGreaterThan(0)
    },
  )

  it('lends the original face to a victory cinematic and restores the combat expression exactly', () => {
    const fighter = createFightState('hisoka', 'kurapika').player
    const model = figure(fighter)
    draw(model, hurt(fighter), 1)
    const rig = fightFaceRig(model.root)!
    const weights = rig.mouth!.morphTargetInfluences!.slice()
    const eye = rig.eyes[0].node.scale.y
    const restore = suspendFightExpression(model.root)
    expect(rig.mouth!.morphTargetInfluences).toEqual([0, 0, 0])
    expect(rig.eyes[0].node.scale.y).toBe(rig.eyes[0].scale)
    restore()
    expect(rig.eyes[0].node.scale.y).toBe(eye)
    expect(rig.mouth!.morphTargetInfluences).toEqual(weights)
  })

  it.each(BASELINE_FIGHTERS)(
    '%s: rendering does not modify combat, replay hashes or geometry identity',
    (id) => {
      const state = createFightState(id, 'hisoka')
      state.player = hurt(state.player)
      const hash = fightReplayHash(state)
      const model = figure(state.player)
      const ids = meshIds(model.root)
      for (let frame = 0; frame < 120; frame++) draw(model, state.player, frame / 60)
      expect(fightReplayHash(state)).toBe(hash)
      expect(meshIds(model.root)).toEqual(ids)
      draw(model, state.player, 0) // Replay seeking backwards must reset blending.
      expect(fightFaceRig(model.root)!.pose!.pain).toBeCloseTo(
        fightExpressionTarget(state.player, 0.2).pose.pain,
      )
    },
  )

  it('keeps an unsupported fighter on its existing animation', () => {
    const fighter = createFightState('kacho' as FighterId, 'hisoka').player
    const model = figure(fighter)
    draw(model, fighter, 1)
    expect(fightFaceRig(model.root)).toBeUndefined()
  })

  it('mirrors the camera opening while keeping the pupils aimed towards the opponent', () => {
    const fighter = createFightState('kurapika', 'hisoka').player
    const right = fightExpressionTarget({ ...fighter, facing: 1 }, 0).pose
    const left = fightExpressionTarget({ ...fighter, facing: -1 }, 0).pose
    expect(right.headYaw).toBe(-left.headYaw)
    expect(right.gaze).toBe(-left.gaze)
    expect(right.headYaw).toBeLessThan(0)
    expect(right.gaze).toBeGreaterThan(0)
  })

  it('can lend the entire expression layer to another presentation without keeping old pain', () => {
    const fighter = createFightState('hisoka', 'kurapika').player
    const model = figure(fighter)
    const rig = fightFaceRig(model.root)!
    draw(model, hurt(fighter), 1)
    rig.active = false
    draw(model, fighter, 1.1)
    expect(rig.pose).toBeNull()
    expect(rig.mouth!.morphTargetInfluences).toEqual([0, 0, 0])
    expect(rig.pupils[0].node.position.x).toBe(rig.pupils[0].x)
    rig.active = true
    draw(model, fighter, 1.2)
    expect(rig.pose!.pain).toBe(0)
    expect(rig.mode).toBe('concentration')
  })
})

function meshIds(root: THREE.Object3D) {
  const ids: string[] = []
  root.traverse((node) => {
    if (node instanceof THREE.Mesh) ids.push(node.geometry.uuid)
  })
  return ids.sort()
}
