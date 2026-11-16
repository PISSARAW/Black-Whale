import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure, type HumanLook } from './humanFigure'
import { buildFightFigure } from '../fighting/fighterFigure'
import { createFightState } from '../fighting/fightState'
import { fightBodyMotion } from '../fighting/fightBodyMotion'
import { fighterDefinition } from '../fighting/roster'
import type { FighterId } from '../fighting/types'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

function visitor(id: FighterId): HumanLook {
  const definition = fighterDefinition(id)
  return {
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
    human: { role: definition.modelRole, identity: definition.modelId, pose: 'idle', aura: 'none' },
  }
}

function mesh(root: THREE.Object3D, name: string): THREE.Mesh {
  const found = root.getObjectByName(name)
  expect(found, name).toBeInstanceOf(THREE.Mesh)
  return found as THREE.Mesh
}

describe('shared model detail integration', () => {
  it.each(['kurapika', 'hisoka', 'biscuit', 'franklin'] as const)(
    'shares cached facial and hand detail buffers with Fighting: %s',
    (id) => {
      const tour = buildHumanFigure({ THREE, glow, seen: visitor(id) })
      const fight = buildFightFigure({
        THREE,
        glow,
        fighter: createFightState(id, 'hisoka').player,
      })
      const shared =
        id === 'franklin'
          ? ['eye-pupil', 'face-relief']
          : ['hand-left', 'hand-right', 'eye-pupil', 'face-relief']
      for (const name of shared) {
        expect(mesh(fight.root, name).geometry).toBe(mesh(tour.root, name).geometry)
      }
      // The distant representation still has only its three original masses.
      expect(tour.lod.far.children).toHaveLength(3)
      expect(tour.lod.far.getObjectByName('eye-pupil')).toBeUndefined()
    },
  )

  it('carries cuffs, soles and garment seams with the combat joints', () => {
    const fighter = createFightState('kurapika', 'hisoka').player
    const model = buildFightFigure({ THREE, glow, fighter })
    model.animate(1, 'idle', { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
    const elbow = model.root.getObjectByName('elbow-left')!
    const knee = model.root.getObjectByName('knee-left')!
    expect(elbow.children[0].getObjectByName('hand-left')).toBeUndefined()
    expect(mesh(model.root, 'hand-left').parent).toBe(elbow)
    expect(elbow.getObjectByName('sleeve-cuff')?.parent).toBe(elbow)
    expect(knee.children[1].getObjectByName('shoe-sole-and-toecap')).toBeTruthy()
    expect(mesh(model.root, 'garment-seams').parent?.name).toBe('fight-chest')
    model.root.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(model.root)
    expect(Number.isFinite(box.min.y)).toBe(true)
    expect(box.max.y - box.min.y).toBeGreaterThan(1)
  })

  it('keeps detailed eyes closed during Parallel Future and colours the iris in Emperor Time', () => {
    const base = createFightState('kurapika', 'hisoka').player
    const closed = buildFightFigure({ THREE, glow, fighter: { ...base, parallelEyesClosed: true } })
    expect(mesh(closed.root, 'eye-pupil').parent?.scale.y).toBe(0.08)
    const emperor = buildFightFigure({
      THREE,
      glow,
      fighter: {
        ...base,
        kurapika: { ...base.kurapika!, emperorTime: true },
      },
    })
    const iris = mesh(emperor.root, 'eye-pupil').material as THREE.MeshBasicMaterial
    expect(iris.color.getHex()).toBe(0xef3340)
    const white = mesh(emperor.root, 'eye-sclera').material as THREE.MeshBasicMaterial
    const normalWhite = mesh(closed.root, 'eye-sclera').material as THREE.MeshBasicMaterial
    expect(white.color.getHex()).toBe(normalWhite.color.getHex())
  })
})
