import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { combatBodyGeometry, improveFightBodyReadability } from './fightBodyReadability'
import { buildFightFigure } from './fighterFigure'
import { createFightState } from './fightState'
import { FIGHTING_ROSTER } from './roster'

const glow = (color: number, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

describe('fight body readability', () => {
  it('bakes a reusable three-tone key and rim without mutating source geometry', () => {
    const source = new THREE.SphereGeometry(1, 8, 6)
    const first = combatBodyGeometry(source)
    const second = combatBodyGeometry(source)
    expect(first).not.toBe(source)
    expect(second).toBe(first)
    expect(source.getAttribute('color')).toBeUndefined()
    expect(first.userData.combatBodyReadability).toBe(true)
    const colours = first.getAttribute('color')
    const values = new Set(
      Array.from({ length: colours.count }, (_, index) => colours.getX(index).toFixed(3)),
    )
    expect(values.size).toBeGreaterThanOrEqual(4)
    expect(Math.max(...[...values].map(Number))).toBeGreaterThan(1)
    expect(Math.min(...[...values].map(Number))).toBeLessThan(0.7)
  })

  it('shades solid front surfaces while preserving ink and transparent details', () => {
    const root = new THREE.Group()
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const surface = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true }),
    )
    const ink = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0x000000, vertexColors: true, side: THREE.BackSide }),
    )
    const glass = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5, vertexColors: true }),
    )
    root.add(surface, ink, glass)
    improveFightBodyReadability(root)
    expect(surface.geometry).not.toBe(geometry)
    expect(ink.geometry).toBe(geometry)
    expect(glass.geometry).toBe(geometry)
  })

  it('covers every roster body in both facings with finite baked colours', () => {
    for (const { id } of FIGHTING_ROSTER) {
      for (const facing of [1, -1] as const) {
        const fighter = createFightState(id, 'hisoka').player
        fighter.facing = facing
        const model = buildFightFigure({ THREE, glow, fighter })
        const surfaces: THREE.Mesh[] = []
        model.root.traverse((node) => {
          const mesh = node as THREE.Mesh
          if (mesh.isMesh && mesh.geometry.userData.combatBodyReadability) surfaces.push(mesh)
        })
        expect(surfaces.length, `${id}:${facing}`).toBeGreaterThanOrEqual(4)
        for (const mesh of surfaces) {
          const colour = mesh.geometry.getAttribute('color')
          expect(colour, `${id}:${mesh.name}`).toBeDefined()
          expect(
            Array.from({ length: colour.count * colour.itemSize }, (_, index) =>
              colour.array.at(index),
            ).every(Number.isFinite),
          ).toBe(true)
        }
      }
    }
  })
})
