import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { createFightState } from './fightState'
import { movesetFor } from './movesets'
import type { ArcadeFighter, MoveSlot } from './types'

const glow = (color: number, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
const FEATURES = [
  'kurapika-camera-lock-left',
  'kurapika-camera-lock-right',
  'kurapika-camera-lapel-left',
  'kurapika-camera-lapel-right',
  'kurapika-camera-chain-band',
] as const
const SLOTS: MoveSlot[] = [
  'standingLight',
  'standingHeavy',
  'lowLight',
  'lowHeavy',
  'airLight',
  'airHeavy',
  'forwardLight',
  'forwardHeavy',
  'backHeavy',
]

describe('P19 gameplay-camera identity lock', () => {
  it('mounts five shared canonical accents on the parts that own them', () => {
    const first = figure('kurapika')
    const second = figure('kurapika')
    const marker = first.root.getObjectByName('fight-gameplay-identity')!
    expect(marker.userData.cameraContract).toEqual({ height: 560, minimumFeaturePixels: 3 })
    expect(figure('chrollo').root.getObjectByName('fight-gameplay-identity')).toBeUndefined()
    for (const name of FEATURES) {
      const part = first.root.getObjectByName(name) as THREE.Mesh
      const duplicate = second.root.getObjectByName(name) as THREE.Mesh
      expect(part, name).toBeDefined()
      expect(part.geometry).toBe(duplicate.geometry)
      expect(part.geometry.userData.gameplayIdentity).toBe(true)
    }
    expect(first.root.getObjectByName('kurapika-camera-lock-left')?.parent?.name).toBe(
      'kurapika-head',
    )
    expect(first.root.getObjectByName('kurapika-camera-lapel-left')?.parent?.name).toBe('torso')
    expect(first.root.getObjectByName('kurapika-camera-chain-band')?.parent?.name).toBe(
      'hand-right',
    )
    for (const side of ['left', 'right'])
      expect(first.root.getObjectByName(`kurapika-jacket-seam-${side}`)?.parent?.name).toBe('torso')
  })

  it('retains a three-pixel major axis through all physical attacks and both facings', () => {
    const fighter = createFightState('kurapika', 'hisoka').player
    const before = JSON.stringify(fighter)
    const model = buildFightFigure({ THREE, glow, fighter })
    const scene = new THREE.Scene()
    scene.add(model.root)
    const camera = new THREE.PerspectiveCamera(34, 1280 / 560, 0.1, 30)
    camera.position.set(0, 2.25, 9.2)
    camera.lookAt(0, 1, 0)
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld(true)

    for (const facing of [1, -1] as const) {
      model.root.rotation.y = facing * 1.25
      for (const [index, slot] of SLOTS.entries()) {
        const posed = attacking(fighter, slot, facing)
        model.animate(index + (facing < 0 ? 20 : 1), 'idle', {
          transitionSeconds: 0,
          motion: fightBodyMotion({ fighter: posed, seconds: index + 1, progress: 0.5 }),
        })
        model.root.updateMatrixWorld(true)
        for (const name of FEATURES) {
          const pixels = projectedMajorAxis(model.root.getObjectByName(name)!, camera)
          expect(pixels, `${facing}:${slot}:${name}`).toBeGreaterThanOrEqual(3)
        }
      }
    }
    expect(JSON.stringify(fighter)).toBe(before)
  })
})

function figure(id: 'kurapika' | 'chrollo') {
  return buildFightFigure({ THREE, glow, fighter: createFightState(id, 'hisoka').player })
}

function attacking(fighter: ArcadeFighter, slot: MoveSlot, facing: 1 | -1): ArcadeFighter {
  const move = movesetFor(fighter.id)!.moves.find((candidate) => candidate.slot === slot)!
  return {
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
}

function projectedMajorAxis(part: THREE.Object3D, camera: THREE.Camera): number {
  const box = new THREE.Box3().setFromObject(part)
  const points: THREE.Vector3[] = []
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z])
        points.push(new THREE.Vector3(x, y, z).project(camera))
  const width =
    (Math.max(...points.map((point) => point.x)) - Math.min(...points.map((p) => p.x))) * 640
  const height =
    (Math.max(...points.map((point) => point.y)) - Math.min(...points.map((p) => p.y))) * 280
  return Math.max(width, height)
}
