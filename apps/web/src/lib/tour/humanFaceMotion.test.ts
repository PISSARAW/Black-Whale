import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure, type HumanLook } from './humanFigure'
import { humanBlink } from './humanFaceMotion'
import { fighterDefinition } from '../fighting/roster'
import type { FighterId } from '../fighting/types'
import { buildFightFigure } from '../fighting/fighterFigure'
import { createFightState } from '../fighting/fightState'
import { fightBodyMotion } from '../fighting/fightBodyMotion'
import { fightFaceRig } from '../fighting/fightExpressionRig'

const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
function figure(id: FighterId, pose: NonNullable<HumanLook['human']>['pose'] = 'idle') {
  const definition = fighterDefinition(id)
  const seen: HumanLook = {
    id,
    kind: 'avatar',
    spaceId: 'room',
    tierId: 'tier-1',
    at: [0, 0],
    y: 0,
    size: 0.42,
    colour: 0xffffff,
    stage: 0,
    hidden: false,
    human: { role: definition.modelRole, identity: definition.modelId, pose, aura: 'none' },
  }
  return buildHumanFigure({ THREE, glow, seen })
}

describe('Tour facial animation', () => {
  it('changes the actual face with the pose and restores it without cumulative deformation', () => {
    const model = figure('kurapika')
    const eye = model.root.getObjectByName('face-eye-left')!
    const brow = model.root.getObjectByName('face-brow-left')!
    const baseEye = eye.scale.y
    const baseBrow = brow.rotation.z
    const geometry = (eye as THREE.Mesh).geometry
    model.animate(0, 'attack')
    expect(eye.scale.y).toBeLessThan(baseEye)
    expect(brow.rotation.z).toBeLessThan(baseBrow)
    model.animate(1, 'listen')
    expect(eye.scale.y).toBeGreaterThan(baseEye)
    model.animate(2, 'fallen')
    expect(eye.scale.y).toBeCloseTo(baseEye * 0.08)
    model.animate(0, 'idle')
    const restored = eye.scale.y
    for (let i = 0; i < 100; i++) model.animate(0, 'idle')
    expect(eye.scale.y).toBe(restored)
    expect(brow.rotation.z).toBeCloseTo(baseBrow)
    expect((eye as THREE.Mesh).geometry).toBe(geometry)
  })

  it('captures finished closed eyes and keeps the flute mouth still', () => {
    const resting = figure('kurapika', 'zetsu')
    resting.animate(0, 'zetsu')
    const eye = resting.root.getObjectByName('face-eye-left')!
    const closed = eye.scale.y
    expect(closed).toBeLessThan(0.1)
    resting.animate(1, 'idle')
    expect(eye.scale.y).toBeGreaterThan(closed * 5)
    const melody = figure('melody')
    const mouth = melody.root.getObjectByName('melody-mouth')!
    const scale = mouth.scale.clone()
    melody.animate(1, 'flute')
    expect(mouth.scale.equals(scale)).toBe(true)
  })

  it('preserves Illumi’s impassive face and never reveals a hidden mouth', () => {
    const model = figure('illumi')
    const eye = model.root.getObjectByName('face-eye-left')!
    const scale = eye.scale.y
    model.animate(0, 'attack')
    model.animate(4.9, 'held')
    expect(eye.scale.y).toBe(scale)
    const feitan = figure('feitan')
    const mouth = feitan.root.getObjectByName('face-mouth')!
    const visible = mouth.visible
    feitan.animate(1, 'held')
    expect(mouth.visible).toBe(visible)
  })

  it('uses reproducible and desynchronised blink clocks', () => {
    const sequence = (id: string) => Array.from({ length: 600 }, (_, i) => humanBlink(i / 60, id))
    const first = sequence('kurapika')
    expect(first).toEqual(sequence('kurapika'))
    expect(first).not.toEqual(sequence('chrollo'))
    expect(Math.max(...first)).toBeGreaterThan(0.9)
    expect(first.every((value) => value >= 0 && value <= 1)).toBe(true)
  })

  it('blinks in Clash without changing the underlying emotion or masking an impact', () => {
    const fighter = createFightState('chrollo', 'hisoka').player
    const model = buildFightFigure({ THREE, glow, fighter })
    const seconds = Array.from({ length: 600 }, (_, i) => i / 60).find(
      (time) => humanBlink(time, fighter.id) > 0.99,
    )!
    expect(seconds).toBeDefined()
    model.animate(seconds, 'idle', {
      motion: fightBodyMotion({ fighter, seconds, progress: 0 }),
    })
    const rig = fightFaceRig(model.turns)!
    expect(rig.mode).toBe('concentration')
    expect(rig.eyes[0].node.scale.y).toBeLessThan(rig.eyes[0].scale * 0.1)
    const hurt = { ...fighter, pose: 'hit' as const, hitStun: 12 }
    model.animate(seconds, 'idle', {
      motion: fightBodyMotion({ fighter: hurt, seconds, progress: 0 }),
    })
    expect(rig.mode).toBe('pain')
    expect(rig.eyes[0].node.scale.y).toBeGreaterThan(rig.eyes[0].scale * 0.2)
  })
})
