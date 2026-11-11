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
import { resolveMovement } from './navigation'
import { openingHeights } from './openingHeights'
import { buildTierMesh } from './mesh'
import {
  banquetFixtures,
  banquetSpotAnchors,
  BANQUET_VIEWBOX,
} from '$lib/components/map/projection/banquetPlan'

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
    for (const id of ['banquet-inaugural-hall', 'banquet-throne-panorama', 'banquet-royal-dais']) {
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
    const daisView = mangaViewById('banquet-royal-dais')!
    expect(daisView.staging).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ characterId: 'nasubi-hui-guo-rou', pose: 'seated' }),
        expect.objectContaining({ characterId: 'prince-benjamin' }),
      ]),
    )
  })

  it('offers the supplied panorama from behind the throne toward the performance stage', () => {
    const view = mangaViewById('banquet-throne-panorama')!
    const dais = plan.structures.find(({ id }) => id === `${BANQUET_SPACE}-throne-dais`)!
    const stage = plan.structures.find(({ id }) => id === `${BANQUET_SPACE}-stage`)!

    expect(view.at[1]).toBeLessThan(dais.at[1])
    expect(view.heading).toBeCloseTo(Math.PI)
    expect(view.eyeHeight).toBeGreaterThan(2)
    expect(stage.at[1]).toBeGreaterThan(view.at[1] + 50)
    expect(pointInPolygon(view.at, hall.footprint)).toBe(true)
  })

  it('separates the performance stage from the royal dais and preserves the backstage crossing', () => {
    const stage = plan.structures.find(({ id }) => id === `${BANQUET_SPACE}-stage`)!
    const dais = plan.structures.find(({ id }) => id === `${BANQUET_SPACE}-throne-dais`)!
    expect(stage.spaceId).toBe(BANQUET_SERVICE)
    expect(stage.at[1] - dais.at[1]).toBeGreaterThan(45)
    const crossing = resolveMovement([11.6, 29.35], [-1, 29.35], plan.walls)
    expect(crossing[0]).toBeCloseTo(-1)
    expect(crossing[1]).toBeCloseTo(29.35)
    const exit = resolveMovement([-1, 29.35], [-1, 30.7], plan.walls)
    expect(exit[0]).toBeCloseTo(-1)
    expect(exit[1]).toBeCloseTo(30.7)
    const steps = plan.structures
      .filter(({ id }) => id.includes('-throne-steps'))
      .sort((a, b) => a.height - b.height)
    expect(steps.map(({ height }) => height)).toEqual([0.25, 0.5, 0.75, 1])
    expect(steps.every(({ at }) => at[0] < dais.at[0])).toBe(true)
  })

  it('projects both platforms and the king from the same fixtures in the local map', () => {
    const stage = banquetFixtures.find(({ id }) => id === `${BANQUET_SPACE}-stage`)!
    const dais = banquetFixtures.find(({ id }) => id === `${BANQUET_SPACE}-throne-dais`)!
    expect(stage.point.x).toBeGreaterThan(dais.point.x + 600)
    const king = banquetSpotAnchors.occupants['nasubi-hui-guo-rou']
    expect(king.x).toBeCloseTo((dais.point.x / BANQUET_VIEWBOX.width) * 100)
    expect(king.y).toBeCloseTo((dais.point.y / BANQUET_VIEWBOX.height) * 100)
    expect(king.inferred).toBe(false)
  })

  it('leaves the view of the stage open to the common ceiling across the service step', () => {
    const service = ship.spaces.get(BANQUET_SERVICE)!
    for (const [space, other] of [
      [hall, service],
      [service, hall],
    ]) {
      const opening = openingHeights({ space, other, tier: plan.tier })
      expect(opening.bottom).toBe(opening.top)
      expect(opening.top).toBe(floorOf(space, plan.tier) + space.ceiling!)
    }
    const corridor = ship.spaces.get('tier-1-main-corridor')!
    expect(openingHeights({ space: hall, other: corridor, tier: plan.tier }).bottom).toBe(
      floorOf(hall, plan.tier) + 2.6,
    )
  })

  it('draws no suspended wall across the audience sightline to the performance stage', () => {
    const ids = new Set([BANQUET_SPACE, BANQUET_SERVICE])
    const mesh = buildTierMesh({
      ...plan,
      spaces: plan.spaces.filter(({ id }) => ids.has(id)),
      walls: plan.walls.filter(({ spaceId }) => ids.has(spaceId)),
      structures: plan.structures.filter(({ spaceId }) => ids.has(spaceId)),
      doorways: plan.doorways.filter(({ a, b }) => ids.has(a) && ids.has(b)),
    })
    let blocking = 0
    for (let index = 0; index < mesh.positions.length; index += 9) {
      if (Math.abs(mesh.normals[index + 2]) < 0.99) continue
      const onThreshold = [2, 5, 8].every(
        (offset) => Math.abs(mesh.positions[index + offset] - 20.857) < 0.001,
      )
      const x = (mesh.positions[index] + mesh.positions[index + 3] + mesh.positions[index + 6]) / 3
      const y =
        (mesh.positions[index + 1] + mesh.positions[index + 4] + mesh.positions[index + 7]) / 3
      if (onThreshold && Math.abs(x + 1) < 5 && y > floorOf(hall, plan.tier) + 2.6) blocking++
    }
    expect(blocking).toBe(0)
  })
})
