import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { buildShip } from './blueprint'
import {
  buildSourceBoundInteriorDetails,
  sourceBoundInteriorSurfacePlan,
} from './sourceBoundInteriorView'
import { SOURCE_BOUND_INTERIOR_STYLES } from './sourceBoundInteriorStyles'

const ship = buildShip()

describe('source-bound interiors without published perspective panels', () => {
  for (const style of SOURCE_BOUND_INTERIOR_STYLES) {
    it(`builds bounded batched architecture for ${style.name}`, () => {
      expect(style.evidence.source.length).toBeGreaterThan(20)
      expect(style.evidence.sourceFr.length).toBeGreaterThan(20)
      expect(style.triangleBudget).toBeGreaterThan(0)
      const plan = [...ship.plans.values()].find((candidate) =>
        candidate.spaces.some(({ locationId }) => locationId === style.locationId),
      )!
      const space = plan.spaces.find(({ locationId }) => locationId === style.locationId)!
      const root = buildSourceBoundInteriorDetails({
        THREE,
        plan,
        spaceId: space.id,
        reveal: false,
      })!

      expect(root.children.length).toBeGreaterThan(0)
      expect(root.children.length).toBeLessThanOrEqual(3)
      root.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (!mesh.isMesh) return
        const positions = mesh.geometry.getAttribute('position')
        for (let index = 0; index < positions.count; index++) {
          expect(Number.isFinite(positions.getX(index))).toBe(true)
          expect(Number.isFinite(positions.getY(index))).toBe(true)
          expect(Number.isFinite(positions.getZ(index))).toBe(true)
        }
      })
      expect(
        buildSourceBoundInteriorDetails({ THREE, plan, spaceId: space.id, reveal: true }),
      ).toBeNull()
      expect(sourceBoundInteriorSurfacePlan(plan, false).structures.length).toBeLessThanOrEqual(
        plan.structures.length,
      )
    })
  }
})
