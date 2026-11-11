import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { buildShip, ceilingOf, floorOf } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { buildPrinceApartmentEnvelope, isDetailedApartmentFixture } from './princeApartmentEnvelope'
import { isPrinceBedroomMangaFixture } from './princeBedroomMangaProps'

const ship = buildShip()

const bedroom = (number: number) => {
  const plan = ship.plans.get(`interior-room-${number}`)!
  const spaceId = `tier-1-royal-residential-sector-room-${number}-bedroom`
  const space = plan.spaces.find(({ id }) => id === spaceId)!
  const root = buildPrinceApartmentEnvelope({ THREE, plan, spaceId, reveal: false })!
  root.updateMatrixWorld(true)
  return { plan, space, root }
}

const vertices = (root: THREE.Group): number =>
  (root.children as THREE.Mesh[]).reduce(
    (total, mesh) => total + mesh.geometry.getAttribute('position').count,
    0,
  )

describe('the royal bedrooms of the fourteen princes', () => {
  it('builds rich, finite and room-bounded geometry for every prince', () => {
    for (let number = 1001; number <= 1014; number++) {
      const { plan, space, root } = bedroom(number)
      const box = new THREE.Box3().setFromObject(root)
      const xs = space.footprint.map(([x]) => x)
      const zs = space.footprint.map(([, z]) => z)
      const floor = floorOf(space, plan.tier)
      const trimDepth = 0.12

      expect(vertices(root), String(number)).toBeGreaterThan(2_000)
      expect(box.min.x, String(number)).toBeGreaterThanOrEqual(Math.min(...xs) - trimDepth)
      expect(box.max.x, String(number)).toBeLessThanOrEqual(Math.max(...xs) + trimDepth)
      expect(box.min.z, String(number)).toBeGreaterThanOrEqual(Math.min(...zs) - trimDepth)
      expect(box.max.z, String(number)).toBeLessThanOrEqual(Math.max(...zs) + trimDepth)
      expect(box.min.y, String(number)).toBeGreaterThanOrEqual(floor - 0.02)
      expect(box.max.y, String(number)).toBeLessThanOrEqual(
        floor + ceilingOf(space, plan.tier) + 0.02,
      )
      for (const value of [box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z]) {
        expect(Number.isFinite(value), String(number)).toBe(true)
      }
      expect(root.getObjectByProperty('isLight', true), String(number)).toBeUndefined()
      disposeBanquetDetails(root)
    }
  })

  it('replaces the manga-established bedroom props with detailed models', () => {
    for (const number of [1008, 1011, 1012]) {
      const plan = ship.plans.get(`interior-room-${number}`)!
      const props = plan.structures.filter(isPrinceBedroomMangaFixture)
      expect(props.length, String(number)).toBeGreaterThan(0)
      expect(props.every(isDetailedApartmentFixture), String(number)).toBe(true)
    }
  })

  it('gives Salé-salé, Fugetsu and Momoze more panel-specific detail than a plan-only room', () => {
    const standard = bedroom(1010)
    const panelRooms = [bedroom(1008), bedroom(1011), bedroom(1012)]
    for (const { root } of panelRooms) {
      expect(vertices(root)).toBeGreaterThan(vertices(standard.root))
      disposeBanquetDetails(root)
    }
    disposeBanquetDetails(standard.root)
  })
})
