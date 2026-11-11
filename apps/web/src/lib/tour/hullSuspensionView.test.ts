import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { floorOf, theShip } from './blueprint'
import {
  buildHullSuspensionDetails,
  hasHullSuspensionModel,
  HULL_SUSPENSION_SPACE,
  hullSuspensionSurfacePlan,
} from './hullSuspensionView'

const ship = theShip()
const plan = ship.plans.get('interior-hull-suspension')!
const space = ship.spaces.get(HULL_SUSPENSION_SPACE)!

const build = () =>
  buildHullSuspensionDetails({ THREE, plan, spaceId: HULL_SUSPENSION_SPACE, reveal: false })!

describe('the chapter 406 hull suspension bay', () => {
  it('replaces every coarse spring with a complete batched mounting', () => {
    const springs = plan.structures.filter(hasHullSuspensionModel)
    expect(springs).toHaveLength(6)
    expect(
      hullSuspensionSurfacePlan(plan, false).structures.filter(hasHullSuspensionModel),
    ).toEqual([])
    expect(hullSuspensionSurfacePlan(plan, true)).toBe(plan)

    const root = build()
    expect(root.name).toBe('hull-suspension-manga-details')
    expect(root.children).toHaveLength(1)
    disposeBanquetDetails(root)
  })

  it('keeps the machinery finite, inside the bay and below the shared detail budget', () => {
    const root = build()
    const mesh = root.children[0] as THREE.Mesh
    const positions = mesh.geometry.getAttribute('position')
    expect(Array.from(positions.array).every(Number.isFinite)).toBe(true)
    expect(positions.count / 3).toBeLessThan(150_000)

    const bounds = new THREE.Box3().setFromObject(root)
    const floor = floorOf(space, plan.tier)
    expect(bounds.min.x).toBeGreaterThanOrEqual(-20.01)
    expect(bounds.max.x).toBeLessThanOrEqual(20.01)
    expect(bounds.min.y).toBeGreaterThanOrEqual(floor - 0.01)
    expect(bounds.max.y).toBeLessThanOrEqual(floor + space.ceiling! + 0.01)
    expect(bounds.min.z).toBeGreaterThanOrEqual(-10.01)
    expect(bounds.max.z).toBeLessThanOrEqual(0.01)
    disposeBanquetDetails(root)
  })

  it('stays out of evidence mode and unrelated rooms', () => {
    expect(
      buildHullSuspensionDetails({ THREE, plan, spaceId: HULL_SUSPENSION_SPACE, reveal: true }),
    ).toBeNull()
    expect(
      buildHullSuspensionDetails({
        THREE,
        plan,
        spaceId: 'tier-5-hull-suspension-gangway',
        reveal: false,
      }),
    ).toBeNull()
  })
})
