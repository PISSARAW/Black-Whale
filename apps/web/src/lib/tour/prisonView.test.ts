import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { buildPrisonDetails, prisonSurfacePlan, BEYOND_CELL, BEYOND_WATCH } from './prisonView'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { mangaViewById, viewsForSpace } from './mangaViews'
import { pointInPolygon, structureFootprint } from './geometry'
import {
  prisonFixtures,
  prisonPoint,
  prisonSpotAnchors,
  PRISON_VIEWBOX,
} from '$lib/components/map/projection/prisonPlan'

const ship = theShip()
const plan = ship.plans.get('interior-beyond-cell')!
const build = (spaceId: string, structures = plan.structures) =>
  buildPrisonDetails({ THREE, plan: { ...plan, structures }, spaceId, reveal: false })!

describe('Beyond’s prison, chapter 359', () => {
  it('keeps the reconstructed fixtures inside the rooms without introducing blueprint errors', () => {
    expect(validateBlueprint().filter((issue) => issue.includes('prison-beyond'))).toEqual([])
    for (const id of [BEYOND_CELL, BEYOND_WATCH]) {
      const root = build(id)
      expect(root.children).toHaveLength(1)
      const mesh = root.children[0] as THREE.Mesh
      const positions = mesh.geometry.getAttribute('position')
      expect(Array.from(positions.array).every(Number.isFinite)).toBe(true)
      expect(positions.count / 3).toBeLessThan(20_000)
      const room = ship.spaces.get(id)!
      const bounds = new THREE.Box3().setFromObject(root)
      expect(bounds.min.y).toBeGreaterThanOrEqual(floorOf(room, plan.tier) - 0.001)
      expect(bounds.max.y).toBeLessThan(floorOf(room, plan.tier) + room.ceiling!)
      for (let i = 0; i < positions.count; i++) {
        expect(
          pointInPolygon([positions.getX(i), positions.getZ(i)], room.footprint),
          `${id}: ${positions.getX(i)}, ${positions.getZ(i)}`,
        ).toBe(true)
      }
      disposeBanquetDetails(root)
    }
  })

  it('replaces generic solid drawings while preserving the walked collision plan and evidence mode', () => {
    const surfaces = prisonSurfacePlan(plan, false)
    expect(surfaces.walls).toBe(plan.walls)
    expect(surfaces.structures.map(({ kind }) => kind)).toEqual(['bars', 'bars'])
    expect(plan.structures.some(({ kind }) => kind === 'bed')).toBe(true)
    expect(prisonSurfacePlan(plan, true)).toBe(plan)
    expect(buildPrisonDetails({ THREE, plan, spaceId: BEYOND_CELL, reveal: true })).toBeNull()
    expect(
      buildPrisonDetails({ THREE, plan, spaceId: 'tier-1-banquet-hall', reveal: false }),
    ).toBeNull()
  })

  it('does not leave a bunk, pillow or drink behind when its supporting solid is removed', () => {
    for (const suffix of ['bunk', 'side-table', 'manacle']) {
      const structure = plan.structures.find(({ id }) => id.endsWith(`-${suffix}`))!
      const root = build(BEYOND_CELL, [structure])
      const removed = build(BEYOND_CELL, [])
      expect(root.children).toHaveLength(1)
      expect(removed.children).toHaveLength(0)
      disposeBanquetDetails(root)
      disposeBanquetDetails(removed)
    }
  })

  it('follows the translation and rotation of a moved bunk instead of using its original coordinates', () => {
    const bunk = plan.structures.find(({ kind }) => kind === 'bed')!
    const moved = { ...bunk, at: [-4, 2] as const, rotation: 90 }
    const root = build(BEYOND_CELL, [moved])
    const bounds = new THREE.Box3().setFromObject(root)
    expect(bounds.getCenter(new THREE.Vector3()).x).toBeCloseTo(-4, 1)
    expect(bounds.getCenter(new THREE.Vector3()).z).toBeCloseTo(2, 1)
    expect(bounds.max.z - bounds.min.z).toBeCloseTo(bunk.size[0], 1)
    expect(bounds.max.x - bounds.min.x).toBeCloseTo(bunk.size[1], 1)
    disposeBanquetDetails(root)
  })

  it('projects the corrected bunk and the occupant marker from the same plan', () => {
    const bunk = plan.structures.find(({ kind }) => kind === 'bed')!
    const fixture = prisonFixtures.find(({ id }) => id === bunk.id)!
    expect(fixture.point).toEqual(prisonPoint(bunk.at))
    expect(prisonSpotAnchors.occupants['beyond-netero'].x).toBeCloseTo(
      (fixture.point.x / PRISON_VIEWBOX.width) * 100,
    )
    expect(prisonSpotAnchors.occupants['beyond-netero'].y).toBeCloseTo(
      (fixture.point.y / PRISON_VIEWBOX.height) * 100,
    )
  })

  it('offers the panel views from either side, with a clear camera actually outside the bars', () => {
    const view = mangaViewById('beyond-cell-bars')!
    expect(view.spaceId).toBe(BEYOND_WATCH)
    expect(view.chapter).toBe(359)
    expect(pointInPolygon(view.at, ship.spaces.get(BEYOND_WATCH)!.footprint)).toBe(true)
    expect(
      plan.structures.some((solid) => pointInPolygon(view.at, structureFootprint(solid))),
    ).toBe(false)
    for (const spaceId of [BEYOND_CELL, BEYOND_WATCH]) {
      expect(viewsForSpace(spaceId)).toContain(view)
      expect(viewsForSpace(spaceId)).toContain(mangaViewById('beyond-cell-restraint'))
    }
  })
})
