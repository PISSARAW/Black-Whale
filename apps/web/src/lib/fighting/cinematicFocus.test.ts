import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { FIGHTING_ROSTER } from './roster'
import { buildFightFigure } from './fighterFigure'
import { createFight } from './engine'
import { resolveCameraAnchor, aimCinematicFocus } from './cinematicFocus'
import { FIGHTER_CAMERA_PARTS } from './cinematicMoveLenses'
import { disposeMountedVisitHatsu } from './visitHatsuModel'
import { rig } from './cinematicRules'
import type { CameraDetail } from './cinematicTypes'

describe('real forty-fighter detail lenses', () => {
  for (const { id } of FIGHTING_ROSTER)
    it(`${id}: resolves the real rig and fits its focus at desktop and portrait ratios`, () => {
      const state = createFight(id, 'hisoka')
      const scene = new THREE.Scene()
      const materials: THREE.Material[] = []
      const glow = (color: number, opacity: number) => {
        const m = new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
        materials.push(m)
        return m
      }
      const model = buildFightFigure({ THREE, glow, fighter: state.player })
      model.root.position.x = 1.3
      scene.add(model.root)
      const options = { scene, figureOf: () => model.root }
      const part = FIGHTER_CAMERA_PARTS[id as keyof typeof FIGHTER_CAMERA_PARTS]
      const anchor = rig('player', part)
      const subject = resolveCameraAnchor(anchor, options, state)!
      expect(subject.box.isEmpty()).toBe(false)
      for (const aspect of [0.65, 1.75, 2.24]) {
        const camera = new THREE.PerspectiveCamera(28, aspect, 0.02, 100)
        const detail: CameraDetail = {
          kind: 'focus',
          side: 'player',
          labelFr: id,
          labelEn: id,
          anchors: [anchor],
        }
        expect(aimCinematicFocus({ ...options, camera, state, detail })).toBe(true)
        const { min, max } = subject.box
        for (const x of [min.x, max.x])
          for (const y of [min.y, max.y])
            for (const z of [min.z, max.z]) {
              const p = new THREE.Vector3(x, y, z).project(camera)
              expect(Math.abs(p.x)).toBeLessThan(0.94)
              expect(Math.abs(p.y)).toBeLessThan(0.9)
            }
      }
      disposeMountedVisitHatsu(model.root)
      materials.forEach((m) => m.dispose())
    })
  it('keeps both physical contacts of Sweet Home and a world prop inside the same detail frame', () => {
    const scene = new THREE.Scene()
    const actors = { player: new THREE.Group(), opponent: new THREE.Group() }
    actors.player.position.x = -2
    actors.opponent.position.x = 2
    scene.add(actors.player, actors.opponent)
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.MeshBasicMaterial(),
    )
    crate.name = 'prepared:crate'
    crate.position.set(3, 0.4, 0)
    scene.add(crate)
    const camera = new THREE.PerspectiveCamera(28, 0.65, 0.02, 100)
    const detail: CameraDetail = {
      kind: 'focus',
      side: 'player',
      labelFr: 'Sweet Home',
      labelEn: 'Sweet Home',
      anchors: [
        rig('player', 'hands'),
        rig('opponent', 'chest'),
        { type: 'entity', id: 'crate', x: 76, y: 0 },
      ],
    }
    const state = createFight('terebellum', 'hisoka')
    const options = { scene, figureOf: (side: 'player' | 'opponent') => actors[side] }
    expect(aimCinematicFocus({ ...options, camera, state, detail })).toBe(true)
    for (const anchor of detail.anchors!) {
      const p = resolveCameraAnchor(anchor, options, state)!
        .box.getCenter(new THREE.Vector3())
        .project(camera)
      expect(Math.abs(p.x)).toBeLessThan(0.9)
      expect(Math.abs(p.y)).toBeLessThan(0.9)
    }
    crate.geometry.dispose()
    crate.material.dispose()
  })
})
