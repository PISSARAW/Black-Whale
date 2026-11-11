import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { buildQueenApartmentDetails, queenApartmentSurfacePlan } from './queenApartmentView'
import { QUEEN_APARTMENT_ROOMS, QUEEN_DUAZUL_ROOM } from './queenApartmentProgramme'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { structureFootprint, pointInPolygon, polygonsOverlap } from './geometry'
import { viewsForSpace, mangaViewById } from './mangaViews'
import { queenApartmentLayout } from '$lib/components/map/projection/queenApartmentPlan'
import { resolveMapAssetKey } from '$lib/map/mapAssetRegistry'

const plan = theShip().plans.get('tier-1')!
const fixtures = (spaceId: string) => plan.structures.filter((item) => item.spaceId === spaceId)

describe('the other queens share a reconstructed residential programme', () => {
  it('keeps the common programme separate from Camilla’s published dining scene and Unma’s nursery', () => {
    expect(viewsForSpace(QUEEN_DUAZUL_ROOM)).toEqual([])
    expect(mangaViewById('camilla-duazul-dining')?.spaceId).not.toBe(QUEEN_DUAZUL_ROOM)
    for (const id of QUEEN_APARTMENT_ROOMS) {
      expect(fixtures(id)).toHaveLength(11)
      expect(fixtures(id).every((item) => item.provenance === 'map')).toBe(true)
      expect(fixtures(id).filter((item) => /crib|mobile|mantel|painting/.test(item.id))).toEqual([])
    }
    expect(
      validateBlueprint().filter((issue) => QUEEN_APARTMENT_ROOMS.some((id) => issue.includes(id))),
    ).toEqual([])
  })

  it('keeps all seven layouts in bounds, without overlapping floor furniture', () => {
    for (const id of QUEEN_APARTMENT_ROOMS) {
      const room = plan.spaces.find((space) => space.id === id)!
      const solids = fixtures(id).filter((item) => item.base === 0)
      for (const item of solids) {
        const footprint = structureFootprint(item)
        expect(
          footprint.every((at) => pointInPolygon(at, room.footprint)),
          item.id,
        ).toBe(true)
        for (const other of solids.filter((candidate) => candidate.id > item.id))
          expect(
            polygonsOverlap(footprint, structureFootprint(other)),
            `${item.id}/${other.id}`,
          ).toBe(false)
      }
    }
  })

  it('projects the actual fixtures and doors of all seven rooms to accessible individual maps', () => {
    for (const id of QUEEN_APARTMENT_ROOMS) {
      const layout = queenApartmentLayout(id)!
      expect(resolveMapAssetKey('LOCAL', 'tier-1', id)).toBe('queens-living-quarters')
      expect(layout.fixtures.map(({ id }) => id)).toEqual(fixtures(id).map(({ id }) => id))
      expect(layout.doors).toHaveLength(1)
      for (const item of fixtures(id))
        for (const at of structureFootprint(item)) {
          const point = layout.point(at)
          expect(point.x).toBeGreaterThan(0)
          expect(point.x).toBeLessThan(500)
          expect(point.y).toBeGreaterThan(0)
          expect(point.y).toBeLessThan(1100)
        }
    }
    expect(queenApartmentLayout('unknown')).toBeNull()
  })

  it('changes only visuals and preserves the original collision plan and evidence mode', () => {
    const surface = queenApartmentSurfacePlan(plan, false)
    expect(surface.structures).toEqual(
      plan.structures.filter((item) => !QUEEN_APARTMENT_ROOMS.includes(item.spaceId)),
    )
    expect(fixtures(QUEEN_DUAZUL_ROOM)).toHaveLength(11)
    expect(queenApartmentSurfacePlan(plan, true)).toBe(plan)
    expect(
      buildQueenApartmentDetails({ THREE, plan, spaceId: QUEEN_DUAZUL_ROOM, reveal: true }),
    ).toBeNull()
    expect(
      buildQueenApartmentDetails({
        THREE,
        plan,
        spaceId: 'tier-1-queens-living-quarters-room-01',
        reveal: false,
      }),
    ).toBeNull()
  })

  it('batches finite detailed furniture inside every room envelope, with no inferred light objects', () => {
    for (const id of QUEEN_APARTMENT_ROOMS) {
      const room = plan.spaces.find((space) => space.id === id)!
      const root = buildQueenApartmentDetails({ THREE, plan, spaceId: id, reveal: false })!
      const bounds = new THREE.Box3().setFromObject(root)
      const xs = room.footprint.map(([x]) => x),
        zs = room.footprint.map(([, z]) => z)
      expect(bounds.min.y).toBeGreaterThanOrEqual(floorOf(room, plan.tier) - 0.01)
      expect(bounds.max.y).toBeLessThanOrEqual(floorOf(room, plan.tier) + room.ceiling! + 0.01)
      expect(bounds.min.x).toBeGreaterThanOrEqual(Math.min(...xs) - 0.01)
      expect(bounds.max.x).toBeLessThanOrEqual(Math.max(...xs) + 0.01)
      expect(bounds.min.z).toBeGreaterThanOrEqual(Math.min(...zs) - 0.01)
      expect(bounds.max.z).toBeLessThanOrEqual(Math.max(...zs) + 0.01)
      expect(root.children.length).toBeLessThanOrEqual(2)
      for (const mesh of root.children as THREE.Mesh[]) {
        expect(mesh.isMesh).toBe(true)
        expect(
          Array.from(mesh.geometry.getAttribute('position').array).every(Number.isFinite),
        ).toBe(true)
      }
      disposeBanquetDetails(root)
    }
  })
})
