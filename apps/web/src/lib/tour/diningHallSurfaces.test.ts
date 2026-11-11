import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip } from './blueprint'
import { DINING_HALL_SPACE, buildDiningHallDetails, disposeBanquetDetails } from './diningHallView'
import { diningHallSurfacePlan, hasDiningHallModel } from './diningHallSurfacePlan'
import { diningHallWallRuns } from './diningHallWallDetails'

const ship = theShip()
const plan = ship.plans.get('tier-5')!
const room = ship.spaces.get(DINING_HALL_SPACE)!

describe('readable refectory furniture, service glass and wall openings', () => {
  it('replaces the coarse furniture only in the drawing and keeps the physical plan intact', () => {
    const before = [...plan.structures]
    const drawing = diningHallSurfacePlan(plan, false)
    expect(drawing.structures.some(hasDiningHallModel)).toBe(false)
    expect(drawing.structures.filter(({ spaceId }) => spaceId !== room.id)).toEqual(
      plan.structures.filter(({ spaceId }) => spaceId !== room.id),
    )
    expect(plan.structures).toEqual(before)
    expect(drawing.walls).toBe(plan.walls)
    expect(drawing.doorways).toBe(plan.doorways)
    expect(drawing.columns).toBe(plan.columns)
    expect(diningHallSurfacePlan(plan, true)).toBe(plan)
  })

  it('keeps the generic representation of a rotated Hatsu table instead of drawing two orientations', () => {
    const table = plan.structures.find(
      (solid) => hasDiningHallModel(solid) && solid.kind === 'table',
    )!
    const rotated = { ...table, rotation: 35 }
    expect(hasDiningHallModel(rotated)).toBe(false)
    const changed = { ...plan, structures: [rotated] }
    expect(diningHallSurfacePlan(changed, false).structures).toEqual([rotated])
  })

  it('cuts every doorway out of the protective wall lining', () => {
    const runs = diningHallWallRuns(plan, room)
    const doors = plan.doorways.filter((door) => door.a === room.id || door.b === room.id)
    const length = (a: readonly number[], b: readonly number[]) =>
      Math.hypot(a[0] - b[0], a[1] - b[1])
    const perimeter = room.footprint.reduce(
      (sum, at, index) => sum + length(at, room.footprint[(index + 1) % room.footprint.length]),
      0,
    )
    const clearWidth = doors.reduce((sum, door) => sum + length(door.start, door.end), 0)
    expect(doors.length).toBeGreaterThan(0)
    expect(runs.reduce((sum, run) => sum + length(run.start, run.end), 0)).toBeCloseTo(
      perimeter - clearWidth,
    )
    for (const door of doors) {
      const middle = [(door.start[0] + door.end[0]) / 2, (door.start[1] + door.end[1]) / 2]
      for (const run of runs) {
        expect(length(run.start, middle) + length(middle, run.end)).toBeGreaterThan(
          length(run.start, run.end) + 0.01,
        )
      }
    }
  })

  it('uses one separate transparent service screen, removed when its counter disappears', () => {
    const root = buildDiningHallDetails({ THREE, plan, spaceId: room.id, reveal: false })!
    const glass = root.getObjectByName('dining-hall-service-glass') as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.MeshBasicMaterial
    >
    expect(glass.material.transparent).toBe(true)
    expect(glass.material.opacity).toBeLessThan(0.2)
    expect(glass.material.depthWrite).toBe(false)
    const withoutCounter = buildDiningHallDetails({
      THREE,
      spaceId: room.id,
      reveal: false,
      plan: {
        ...plan,
        structures: plan.structures.filter(({ id }) => id !== `${room.id}-service-counter`),
      },
    })!
    expect(withoutCounter.getObjectByName('dining-hall-service-glass')).toBeUndefined()
    disposeBanquetDetails(root)
    disposeBanquetDetails(withoutCounter)
  })
})
