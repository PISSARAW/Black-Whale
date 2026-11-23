import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { createFightState } from './fightState'
import { movesetFor } from './movesets'
import type { ArcadeFighter, MoveSlot } from './types'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

const STRESS_MOVES: MoveSlot[] = ['standingHeavy', 'lowHeavy', 'airHeavy']
const JOINTS = [
  'fight-shoulder-volume-left',
  'fight-shoulder-volume-right',
  'fight-elbow-volume-left',
  'fight-elbow-volume-right',
  'fight-knee-volume-left',
  'fight-knee-volume-right',
] as const

describe('P17 anatomy and P20 roster rollout', () => {
  it('is fight-only, roster-wide and shares its joint geometry', () => {
    const fighter = createFightState('kurapika', 'hisoka').player
    const first = buildFightFigure({ THREE, glow, fighter })
    const second = buildFightFigure({ THREE, glow, fighter })
    const other = buildFightFigure({
      THREE,
      glow,
      fighter: createFightState('chrollo', 'hisoka').player,
    })

    expect(first.root.getObjectByName('fight-joint-volumes')?.userData.rollout).toBe(
      'roster-articulated-anatomy',
    )
    expect(other.root.getObjectByName('fight-joint-volumes')).toBeDefined()
    for (const name of JOINTS) expect(first.root.getObjectByName(name), name).toBeDefined()
    expect(
      JOINTS.filter((name) => name.includes('elbow') || name.includes('knee')).reduce(
        (total, name) => total + first.root.getObjectByName(name)!.children.length,
        0,
      ),
    ).toBe(8)
    for (const name of ['fight-elbow-volume-left', 'fight-knee-volume-right']) {
      const a = first.root.getObjectByName(name)!.children[0] as THREE.Mesh
      const b = second.root.getObjectByName(name)!.children[0] as THREE.Mesh
      expect(a.geometry).toBe(b.geometry)
      expect(a.geometry).toBe(
        (other.root.getObjectByName(name)!.children[0] as THREE.Mesh).geometry,
      )
      expect(a.geometry.userData.fightJointVolume).toBe(true)
    }
  })

  it('deforms on heavy, low and air keys in both facings without moving a hinge', () => {
    const fighter = createFightState('kurapika', 'hisoka').player
    const before = JSON.stringify(fighter)
    const model = buildFightFigure({ THREE, glow, fighter })
    const hinges = ['elbow-left', 'elbow-right', 'knee-left', 'knee-right'].map((name) =>
      model.root.getObjectByName(name)!,
    )
    const hingePositions = hinges.map((hinge) => hinge.position.clone())
    const restScales = new Map(
      JOINTS.map((name) => [name, model.root.getObjectByName(name)!.scale.clone()]),
    )
    const changed = new Set<string>()

    for (const facing of [1, -1] as const) {
      for (const [index, slot] of STRESS_MOVES.entries()) {
        const move = movesetFor('kurapika')!.moves.find((candidate) => candidate.slot === slot)!
        const posed: ArcadeFighter = {
          ...fighter,
          facing,
          pose: move.kind,
          y: move.variant === 'air' ? 3 : 0,
          attack: {
            kind: move.kind,
            variant: move.variant,
            moveId: move.id,
            frame: move.tuning.startup,
            impacted: false,
            auraCharged: false,
            concealed: false,
            hatsuSource: null,
            projectileSpawned: false,
            reversal: false,
          },
        }
        model.animate(1 + index + (facing < 0 ? 10 : 0), 'idle', {
          transitionSeconds: 0,
          motion: fightBodyMotion({ fighter: posed, seconds: 1, progress: 0.5 }),
        })
        model.root.updateMatrixWorld(true)

        for (const [hingeIndex, hinge] of hinges.entries())
          expect(
            hinge.position.distanceTo(hingePositions[hingeIndex]),
            `${slot}:${hinge.name}`,
          ).toBe(0)
        for (const name of JOINTS) {
          const volume = model.root.getObjectByName(name)!
          expect([volume.scale.x, volume.scale.y, volume.scale.z].every(Number.isFinite)).toBe(true)
          if (volume.scale.distanceTo(restScales.get(name)!) > 0.0001) changed.add(name)
        }
      }
    }

    expect([...changed].some((name) => name.includes('shoulder'))).toBe(true)
    expect([...changed].some((name) => name.includes('elbow'))).toBe(true)
    expect([...changed].some((name) => name.includes('knee'))).toBe(true)
    expect(JSON.stringify(fighter)).toBe(before)
  })
})
