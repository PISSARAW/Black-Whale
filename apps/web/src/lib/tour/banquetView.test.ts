import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf } from './blueprint'
import { pointInPolygon, structureFootprint, polygonsOverlap } from './geometry'
import {
  BANQUET_SPACE,
  BANQUET_SERVICE,
  buildBanquetDetails,
  disposeBanquetDetails,
} from './banquetView'
import { mangaViewById, viewsForSpace } from './mangaViews'

const ship = theShip()
const plan = ship.plans.get('tier-1')!
const hall = ship.spaces.get(BANQUET_SPACE)!
const tables = plan.structures.filter(
  (structure) => structure.spaceId === BANQUET_SPACE && structure.kind === 'table',
)
const details = (spaceId = BANQUET_SPACE) =>
  buildBanquetDetails({ THREE, plan, spaceId, reveal: false })!

describe('the inaugural banquet reconstruction', () => {
  it('keeps round tables within the reshaped hall, clear of one another and of the central aisle', () => {
    expect(tables).toHaveLength(72)
    for (const table of tables) {
      expect(table.size[0], table.id).toBe(table.size[1])
      const footprint = structureFootprint(table)
      expect(
        footprint.every((point) => pointInPolygon(point, hall.footprint)),
        table.id,
      ).toBe(true)
      for (const other of tables.filter((candidate) => candidate.id > table.id)) {
        expect(
          polygonsOverlap(footprint, structureFootprint(other)),
          `${table.id}/${other.id}`,
        ).toBe(false)
      }
      expect(
        footprint.every(([x]) => x < -2 || x > 0),
        table.id,
      ).toBe(true)
    }
  })

  it('batches the furnishings into at most two draw calls per room with finite, bounded geometry', () => {
    for (const spaceId of [BANQUET_SPACE, BANQUET_SERVICE]) {
      const root = details(spaceId)
      const space = ship.spaces.get(spaceId)!
      expect(root.children.length).toBeGreaterThan(0)
      expect(root.children.length).toBeLessThanOrEqual(2)
      let triangles = 0
      for (const child of root.children as THREE.Mesh[]) {
        const positions = child.geometry.getAttribute('position')
        expect(Array.from(positions.array).every(Number.isFinite)).toBe(true)
        triangles += positions.count / 3
      }
      expect(triangles).toBeLessThan(150_000)
      const bounds = new THREE.Box3().setFromObject(root)
      expect(bounds.min.y).toBeGreaterThanOrEqual(floorOf(space, plan.tier))
      expect(bounds.max.y).toBeLessThanOrEqual(floorOf(space, plan.tier) + space.ceiling!)
      disposeBanquetDetails(root)
    }
  })

  it('removes the interpretation in evidence mode and adds nothing to unrelated rooms', () => {
    expect(buildBanquetDetails({ THREE, plan, spaceId: BANQUET_SPACE, reveal: true })).toBeNull()
    expect(
      buildBanquetDetails({ THREE, plan, spaceId: 'tier-1-vip-casino', reveal: false }),
    ).toBeNull()
  })

  it('keeps the throne axis clear of columns and both manga cameras clear of their collision faces', () => {
    const columns = plan.columns.get(BANQUET_SPACE)!
    expect(columns).toHaveLength(8)
    for (const [x, z] of columns) {
      expect(Math.abs(x + 1)).toBeGreaterThan(4)
      expect(pointInPolygon([x, z], hall.footprint)).toBe(true)
    }
    for (const id of ['banquet-inaugural-hall', 'banquet-royal-dais']) {
      const view = mangaViewById(id)!
      expect(columns.every(([x, z]) => Math.hypot(x - view.at[0], z - view.at[1]) > 1)).toBe(true)
    }
  })

  it('does not leave a tablecloth behind when a Hatsu removes the table from the walked plan', () => {
    const root = details()
    const withoutTables = buildBanquetDetails({
      THREE,
      plan: {
        ...plan,
        structures: plan.structures.filter((structure) => !tables.includes(structure)),
      },
      spaceId: BANQUET_SPACE,
      reveal: false,
    })!
    const count = (group: THREE.Group) =>
      (group.children[0] as THREE.Mesh).geometry.getAttribute('position').count
    expect(count(root)).toBeGreaterThan(count(withoutTables) + 72 * 100)
    disposeBanquetDetails(root)
    disposeBanquetDetails(withoutTables)
  })

  it('releases every detail buffer and material with the room', () => {
    const root = details()
    const parent = new THREE.Group()
    parent.add(root)
    const disposed: ReturnType<typeof vi.spyOn>[] = []
    for (const child of root.children as THREE.Mesh[]) {
      disposed.push(vi.spyOn(child.geometry, 'dispose'))
      disposed.push(vi.spyOn(child.material as THREE.Material, 'dispose'))
    }
    disposeBanquetDetails(root)
    expect(root.parent).toBeNull()
    for (const spy of disposed) expect(spy).toHaveBeenCalledTimes(1)
  })

  it('offers the opening-chapter views from both parts of the banquet hall', () => {
    for (const id of ['banquet-inaugural-hall', 'banquet-royal-dais']) {
      const view = mangaViewById(id)!
      expect(view.chapter).toBeLessThanOrEqual(362)
      for (const spaceId of [BANQUET_SPACE, BANQUET_SERVICE])
        expect(viewsForSpace(spaceId)).toContain(view)
      expect(pointInPolygon(view.at, hall.footprint)).toBe(true)
      expect(
        plan.structures.some(
          (structure) =>
            structure.spaceId === BANQUET_SPACE &&
            pointInPolygon(view.at, structureFootprint(structure)),
        ),
      ).toBe(false)
    }
  })
})
