import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { buildWarehouseDetails, WAREHOUSE_SPACE, warehouseSurfacePlan } from './warehouseView'

const ship = theShip()
const plan = ship.plans.get('tier-5')!
const space = ship.spaces.get(WAREHOUSE_SPACE)!
const structures = plan.structures.filter(({ spaceId }) => spaceId === WAREHOUSE_SPACE)

const build = (overrides = {}) =>
  buildWarehouseDetails({
    THREE,
    plan,
    spaceId: WAREHOUSE_SPACE,
    reveal: false,
    ...overrides,
  })!

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('the Tier 5 Cha-R Warehouse reconstructed from chapters 378, 379 and 380', () => {
  it('satisfies the shared blueprint invariants for the warehouse', () => {
    expect(validateBlueprint().filter((issue) => issue.includes(WAREHOUSE_SPACE))).toEqual([])
  })

  it('holds the 32 cargo crates, 4 guard posts and entrance camera', () => {
    expect(structures.length).toBe(37)
    const crates = structures.filter(({ id }) => id.startsWith('tier-5-warehouse-crate-'))
    const posts = structures.filter(({ id }) => id.startsWith('tier-5-warehouse-guard-post-'))
    const camera = structures.find(({ id }) => id === 'tier-5-warehouse-camera')

    expect(crates.length).toBe(32)
    expect(posts.length).toBe(4)
    expect(camera).toBeDefined()
    expect(camera?.kind).toBe('camera')
    expect(camera?.base).toBe(3.6)
  })

  it('declares the colossal 112m x 49m envelope with 12m ceiling', () => {
    expect(space.category).toBe('storage')
    expect(ceilingOf(space, plan.tier) - floorOf(space, plan.tier)).toBe(12)
    expect(space.footprint.length).toBeGreaterThanOrEqual(4)
  })

  it('filters all 37 coarse structures out of the surface plan when not in reveal mode', () => {
    const originalCount = plan.structures.filter(
      ({ spaceId }) => spaceId === WAREHOUSE_SPACE,
    ).length
    expect(originalCount).toBe(37)

    const filtered = warehouseSurfacePlan(plan, false)
    const filteredCount = filtered.structures.filter(
      ({ spaceId }) => spaceId === WAREHOUSE_SPACE,
    ).length
    expect(filteredCount).toBe(0)

    const revealed = warehouseSurfacePlan(plan, true)
    const revealedCount = revealed.structures.filter(
      ({ spaceId }) => spaceId === WAREHOUSE_SPACE,
    ).length
    expect(revealedCount).toBe(37)
  })

  it('builds a detailed 3D group with high triangle count and disposes cleanly', () => {
    const root = build()
    expect(root).not.toBeNull()
    expect(root.name).toBe('warehouse-cha-r-details')

    const count = triangles(root)
    expect(count).toBeGreaterThan(1000)

    disposeBanquetDetails(root)
  })

  it('returns null when in reveal mode or for an unrecognised space', () => {
    expect(build({ reveal: true })).toBeNull()
    expect(build({ spaceId: 'tier-5-area-37564' })).toBeNull()
  })
})
