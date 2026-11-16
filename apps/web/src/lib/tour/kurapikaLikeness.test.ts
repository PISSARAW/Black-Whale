import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure, type HumanLook } from './humanFigure'
import { humanProfile } from './humanProfiles'
import { buildFightFigure } from '../fighting/fighterFigure'
import { createFightState } from '../fighting/fightState'
import { fightBodyMotion } from '../fighting/fightBodyMotion'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
const seen: HumanLook = {
  id: 'kurapika',
  kind: 'avatar',
  spaceId: 'room',
  tierId: 'tier-1',
  at: [0, 0],
  y: 0,
  size: 0.42,
  colour: 0xffffff,
  stage: 0,
  hidden: false,
  human: { role: 'hunter', identity: 'kurapika', pose: 'idle', aura: 'none' },
}

function tour() {
  return buildHumanFigure({ THREE, glow, seen })
}
function fight() {
  const fighter = createFightState('kurapika', 'hisoka').player
  return { fighter, model: buildFightFigure({ THREE, glow, fighter }) }
}
function mesh(root: THREE.Object3D, name: string) {
  const found = root.getObjectByName(name)
  expect(found, name).toBeInstanceOf(THREE.Mesh)
  return found as THREE.Mesh
}

describe('Kurapika likeness from the supplied manga reference', () => {
  it('uses a dark suit and tie, with a white shirt and the declared blond bob', () => {
    const profile = humanProfile(seen)
    expect(profile.jacket).toBe(profile.trousers)
    expect(new THREE.Color(profile.jacket).getHSL({ h: 0, s: 0, l: 0 }).l).toBeLessThan(0.03)
    expect(profile.shirt).toBe(0xf2efe8)
    expect(profile.hairStyle).toBe('bob')
    const model = tour()
    const tie = mesh(model.root, 'kurapika-tie').material as THREE.MeshBasicMaterial
    expect(tie.color.getHex()).toBe(0x17191d)
    expect(model.root.getObjectByName('kurapika-collar-band')).toBeTruthy()
    expect(model.root.getObjectByName('belt-buckle')).toBeUndefined()
  })

  it('shares the custom head, hair and tailored panels between the visit and Fighting', () => {
    const common = tour()
    const { model } = fight()
    for (const name of ['kurapika-shirt', 'kurapika-tie', 'eye-pupil', 'face-relief']) {
      expect(mesh(model.root, name).geometry).toBe(mesh(common.root, name).geometry)
    }
    const a = common.root.getObjectByName('kurapika-layered-bob')!
    const b = model.root.getObjectByName('kurapika-layered-bob')!
    expect((a.children[0] as THREE.Mesh).geometry).toBe((b.children[0] as THREE.Mesh).geometry)
    let draws = 0
    a.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) draws++
    })
    expect(draws).toBeLessThanOrEqual(4)
  })

  it('keeps both eyes visible through the fringe', () => {
    const model = tour()
    model.root.updateMatrixWorld(true)
    for (const name of ['face-eye-left', 'face-eye-right']) {
      const eye = model.root.getObjectByName(name)!
      const center = eye.getWorldPosition(new THREE.Vector3())
      const ray = new THREE.Raycaster(
        center.clone().add(new THREE.Vector3(0, 0, 1)),
        new THREE.Vector3(0, 0, -1),
      )
      const hits = ray.intersectObject(model.lod.near, true)
      expect(hits.length).toBeGreaterThan(0)
      const first = hits[0].object
      expect(first === eye || first.parent === eye || first.parent?.parent === eye).toBe(true)
    }
  })

  it('carries every suit panel with the torso when guarding and attacking', () => {
    const { fighter, model } = fight()
    for (const pose of ['idle', 'walk', 'attack'] as const) {
      model.animate(1, pose, { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
      for (const name of [
        'kurapika-shirt',
        'kurapika-tie',
        'kurapika-collar-band',
        'kurapika-lapel--1',
      ]) {
        expect(model.root.getObjectByName(name)?.parent?.name).toBe('fight-chest')
      }
    }
  })

  it('applies the likeness only to Kurapika', () => {
    const other = buildHumanFigure({
      THREE,
      glow,
      seen: { ...seen, human: { ...seen.human!, identity: 'leorio-paradinight' } },
    })
    expect(other.root.getObjectByName('kurapika-head')).toBeUndefined()
    expect(other.root.getObjectByName('kurapika-shirt')).toBeUndefined()
    expect(other.root.getObjectByName('face-eye-left')).toBeTruthy()
  })
})
