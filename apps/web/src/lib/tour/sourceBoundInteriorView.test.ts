import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { buildShip } from './blueprint'
import { detailTagRangesOf } from './detailTag'
import {
  buildSourceBoundInteriorDetails,
  sourceBoundInteriorSurfacePlan,
} from './sourceBoundInteriorView'
import { SOURCE_BOUND_INTERIOR_STYLES } from './sourceBoundInteriorStyles'
import { distanceToBoundary, pointInPolygon } from './geometry'
import { fittingLampsOf, lamplightOf, lampsOf } from './light'

const ship = buildShip()

describe('source-bound interiors without published perspective panels', () => {
  for (const style of SOURCE_BOUND_INTERIOR_STYLES) {
    it(`builds bounded batched architecture for ${style.name}`, () => {
      expect(style.evidence.source.length).toBeGreaterThan(20)
      expect(style.evidence.sourceFr.length).toBeGreaterThan(20)
      expect(style.triangleBudget).toBeGreaterThan(0)
      const plan = [...ship.plans.values()].find((candidate) =>
        candidate.spaces.some(({ locationId, id }) => (locationId ?? id) === style.locationId),
      )!
      const space = plan.spaces.find(
        ({ locationId, id }) => (locationId ?? id) === style.locationId,
      )!
      const root = buildSourceBoundInteriorDetails({
        THREE,
        plan,
        spaceId: space.id,
        reveal: false,
      })!
      const lamplight = lamplightOf(space, plan.tier)
      const lamps = lampsOf(space.footprint, lamplight)

      expect(root.children.length).toBeGreaterThan(0)
      expect(root.children.length).toBeLessThanOrEqual(3)
      expect(lamplight.modelled).toBe(true)
      expect(fittingLampsOf(space.footprint, lamplight)).toEqual([])
      const fixtures = root.children.find(
        (object) => (object as THREE.Mesh).material instanceof THREE.MeshBasicMaterial,
      ) as THREE.Mesh
      expect(fixtures.geometry.getAttribute('position').count / 36).toBe(lamps.length)
      root.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (!mesh.isMesh) return
        const positions = mesh.geometry.getAttribute('position')
        for (let index = 0; index < positions.count; index++) {
          expect(Number.isFinite(positions.getX(index))).toBe(true)
          expect(Number.isFinite(positions.getY(index))).toBe(true)
          expect(Number.isFinite(positions.getZ(index))).toBe(true)
        }
        let nextFace = 0
        for (const range of detailTagRangesOf(mesh)) {
          expect(range.start).toBe(nextFace)
          expect(range.count).toBeGreaterThan(0)
          expect(range.tag.source.length).toBeGreaterThan(10)
          expect(range.tag.sourceFr.length).toBeGreaterThan(10)
          expect(range.tag.reconstructionRole).toBeDefined()
          nextFace += range.count
        }
        expect(nextFace).toBe(positions.count / 3)
      })
      const footprint = new BanquetDetailBuilder(THREE)
      footprint.polygon(space.footprint, { at: [0, 0, 0], colour: style.floor })
      const floorMesh = footprint.finish().children[0] as THREE.Mesh
      const floorPositions = floorMesh.geometry.getAttribute('position')
      for (let index = 0; index < floorPositions.count; index++) {
        const point = [floorPositions.getX(index), floorPositions.getZ(index)] as const
        expect(
          pointInPolygon(point, space.footprint) ||
            distanceToBoundary(point, space.footprint) < 0.001,
          `${style.name}: ${point.join(',')}`,
        ).toBe(true)
      }
      expect(
        buildSourceBoundInteriorDetails({ THREE, plan, spaceId: space.id, reveal: true }),
      ).toBeNull()
      expect(sourceBoundInteriorSurfacePlan(plan, false).structures.length).toBeLessThanOrEqual(
        plan.structures.length,
      )
    })
  }
})
