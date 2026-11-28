import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure, type HumanLook } from './humanFigure'
import { buildFightFigure } from '../fighting/fighterFigure'
import { combatFaceGeometry } from '../fighting/fightFaceReadability'
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
  it('keeps build and hairstyle identity in the three-mass far LOD', () => {
    const kurapika = buildHumanFigure({ THREE, glow, seen: visitor('kurapika') })
    const benjamin = buildHumanFigure({ THREE, glow, seen: visitor('benjamin') })
    expect(kurapika.lod.far.children).toHaveLength(3)
    expect((kurapika.lod.far.children[2] as THREE.Mesh).geometry).not.toBe(
      (benjamin.lod.far.children[2] as THREE.Mesh).geometry,
    )
    expect((kurapika.lod.far.children[0] as THREE.Mesh).geometry).not.toBe(
      (benjamin.lod.far.children[0] as THREE.Mesh).geometry,
    )
  })

  it.each(['kurapika', 'hisoka', 'biscuit', 'franklin'] as const)(
    'shares detail buffers and caches combat-only skin shading: %s',
    (id) => {
      const tour = buildHumanFigure({ THREE, glow, seen: visitor(id) })
      const fight = buildFightFigure({
        THREE,
        glow,
        fighter: createFightState(id, 'hisoka').player,
      })
      expect(mesh(fight.root, 'eye-pupil').geometry).toBe(mesh(tour.root, 'eye-pupil').geometry)
      if (id !== 'franklin') {
        const secondFight = buildFightFigure({
          THREE,
          glow,
          fighter: createFightState(id, 'hisoka').player,
        })
        for (const name of ['hand-left', 'hand-right']) {
          const canonical = mesh(tour.root, name).geometry
          const combat = mesh(fight.root, name).geometry
          expect(combat).not.toBe(canonical)
          expect(combat).toBe(mesh(secondFight.root, name).geometry)
          expect(combat.userData.humanGeometryVariant).toBe('clash:grip')
          expect(canonical.morphAttributes.position).toBeUndefined()
        }
      }
      const tourFace = mesh(tour.root, 'face-relief').geometry
      const fightFace = mesh(fight.root, 'face-relief').geometry
      expect(fightFace).toBe(
        tourFace.userData.authoredHeadTones ? tourFace : combatFaceGeometry(tourFace),
      )
      if (!tourFace.userData.authoredHeadTones)
        expect(tourFace.getAttribute('color')).toBeUndefined()
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
    const leftFoot = model.root.getObjectByName('foot-left')!
    const rightFoot = model.root.getObjectByName('foot-right')!
    expect(elbow.children[0].getObjectByName('hand-left')).toBeUndefined()
    expect(mesh(model.root, 'hand-left').parent).toBe(elbow)
    expect(elbow.getObjectByName('sleeve-cuff')?.parent).toBe(elbow)
    expect(knee.children[1]).toBe(leftFoot)
    expect(leftFoot.getObjectByName('shoe-sole-and-toecap')).toBeTruthy()
    expect(leftFoot.getObjectByName('ankle-transition')).toBeTruthy()
    expect(model.joints.feet).toEqual([leftFoot, rightFoot])
    expect(mesh(model.root, 'thumb-left').position.x).toBeLessThan(0)
    expect(mesh(model.root, 'thumb-right').position.x).toBeGreaterThan(0)
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
