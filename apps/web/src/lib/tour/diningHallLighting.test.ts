import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf } from './blueprint'
import { fittingHeight } from './fittingHeight'
import { lampsOf, fittingLampsOf, lamplightOf, REACH_RATIO } from './light'
import { DINING_LAMPS, DINING_LAMP_DROP, diningHallLamplight } from './diningHallLighting'
import { DINING_HALL_SPACE, buildDiningHallDetails, disposeBanquetDetails } from './diningHallView'
import { pointInPolygon } from './geometry'

const ship = theShip(),
  plan = ship.plans.get('tier-5')!
const room = ship.spaces.get(DINING_HALL_SPACE)!

describe('refectory suspended lighting and open steelwork', () => {
  it('uses the eighteen suspended fixtures for the bake, without duplicate ceiling quads', () => {
    const light = lamplightOf(room, plan.tier)
    expect(lampsOf(room.footprint, light)).toEqual(DINING_LAMPS)
    expect(DINING_LAMPS).toHaveLength(18)
    expect(DINING_LAMPS.every((at) => pointInPolygon(at, room.footprint))).toBe(true)
    expect(fittingLampsOf(room.footprint, light)).toEqual([])
    expect(light.reach / light.spacing).toBeCloseTo(REACH_RATIO)
    expect(light.dead).toBe(0)
  })

  it('places a visible bulb at every point lighting the floor', () => {
    const root = buildDiningHallDetails({ THREE, plan, spaceId: room.id, reveal: false })!
    const light = lamplightOf(room, plan.tier)
    const floor = floorOf(room, plan.tier)
    const height = fittingHeight(floor, floor + ceilingOf(room, plan.tier), light.drop)
    const batch = root.children.find(
      (item) =>
        item instanceof THREE.Mesh &&
        item.material instanceof THREE.MeshBasicMaterial &&
        !item.material.transparent,
    ) as THREE.Mesh
    const positions = batch.geometry.getAttribute('position')
    for (const [x, z] of DINING_LAMPS) {
      let closest = Infinity
      for (let index = 0; index < positions.count; index++) {
        closest = Math.min(
          closest,
          Math.hypot(
            positions.getX(index) - x,
            positions.getY(index) - height,
            positions.getZ(index) - z,
          ),
        )
      }
      expect(closest).toBeLessThan(0.15)
    }
    expect(height).toBeCloseTo(floor + room.ceiling! - DINING_LAMP_DROP)
    disposeBanquetDetails(root)
  })

  it('keeps the surrounding hold on its ordinary lighting and suspension', () => {
    const hold = plan.spaces.find(({ id }) => id === 'tier-5-warehouse')!
    const light = lamplightOf(hold, plan.tier)
    expect(diningHallLamplight(hold.id, light)).toBe(light)
    expect(fittingLampsOf(hold.footprint, light)).toEqual(lampsOf(hold.footprint, light))
    expect(fittingHeight(0, 4.5, light.drop)).toBe(4.15)
  })

  it('leaves actual openings between the maintenance catwalk’s grating bars', () => {
    const root = buildDiningHallDetails({ THREE, plan, spaceId: room.id, reveal: false })!
    root.updateMatrixWorld(true)
    const y = floorOf(room, plan.tier) + room.ceiling! - 1.35
    const under = (z: number) =>
      new THREE.Raycaster(
        new THREE.Vector3(23.5, y - 0.1, z),
        new THREE.Vector3(0, 1, 0),
        0,
        0.2,
      ).intersectObject(root, true)
    expect(under(20.03)).toHaveLength(0)
    expect(under(20.15).length).toBeGreaterThan(0)
    disposeBanquetDetails(root)
  })
})
