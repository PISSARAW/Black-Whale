import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf } from './blueprint'
import { structureFootprint, pointInPolygon } from './geometry'
import { disposeBanquetDetails, BanquetDetailBuilder } from './banquetDetailBuilder'
import { buildCamillaRoomDetails, camillaSurfacePlan } from './camillaView'
import { CAMILLA_PRIVATE_SPACES } from './camillaApartmentView'
import { MANGA_CAMILLA_APARTMENT_VIEWS } from './mangaCamillaApartmentViews'
import { camillaDiningStaging, musseStaging, camillaGuardStaging } from './mangaCamillaViews'
import { CamillaSurface } from './camillaDetailSurface'
import { fittingLampsOf, lampsOf, lamplightOf } from './light'
import { CAMILLA_SALON_LAMP, CAMILLA_LAMP_DROP } from './camillaLighting'

const ship = theShip(),
  plan = ship.plans.get('interior-room-1002')!
const build = (spaceId: string, overrides = {}) =>
  buildCamillaRoomDetails({ THREE, plan, spaceId, reveal: false, ...overrides })!
const count = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce((n, m) => n + m.geometry.attributes.position.count, 0)

describe('Camilla’s programme-type rooms and source-panel staging', () => {
  it('lights the salon from its chandelier without generic ceiling panels', () => {
    const salon = ship.spaces.get('tier-1-royal-residential-sector-room-1002-living')!
    const light = lamplightOf(salon, plan.tier)
    expect(lampsOf(salon.footprint, light)).toEqual([CAMILLA_SALON_LAMP])
    expect(fittingLampsOf(salon.footprint, light)).toEqual([])
    expect(light.drop).toBe(CAMILLA_LAMP_DROP)
  })
  it('distinguishes published room partitions from reconstructed private furniture', () => {
    expect(CAMILLA_PRIVATE_SPACES).toHaveLength(5)
    for (const id of CAMILLA_PRIVATE_SPACES) {
      expect(ship.spaces.get(id)!.provenance).toBe('panel')
      expect(ship.spaces.get(id)!.sourceFr).toContain('plan publié')
      for (const structure of plan.structures.filter(({ spaceId }) => spaceId === id))
        expect(structure.provenance).toBe('map')
    }
    expect(ship.spaces.get('tier-1-royal-residential-sector-room-1002-dining')!.provenance).toBe(
      'panel',
    )
    expect(camillaSurfacePlan(plan, false).structures).toEqual([])
    expect(camillaSurfacePlan(plan, true)).toBe(plan)
  })

  it('builds finite, bounded details with no additional lights and follows removed furniture', () => {
    for (const id of CAMILLA_PRIVATE_SPACES) {
      const room = ship.spaces.get(id)!,
        root = build(id)
      expect(root.children.length).toBeGreaterThan(0)
      expect(root.children.length).toBeLessThanOrEqual(2)
      expect(count(root) / 3).toBeLessThan(20_000)
      for (const mesh of root.children as THREE.Mesh[])
        expect(Array.from(mesh.geometry.attributes.position.array).every(Number.isFinite)).toBe(
          true,
        )
      const bounds = new THREE.Box3().setFromObject(root)
      expect(bounds.min.y).toBeGreaterThanOrEqual(floorOf(room, plan.tier) - 0.02)
      expect(bounds.max.y).toBeLessThanOrEqual(
        floorOf(room, plan.tier) + ceilingOf(room, plan.tier) + 0.02,
      )
      root.traverse((object) => expect(object instanceof THREE.Light).toBe(false))
      const empty = build(id, { plan: { ...plan, structures: [] } })
      expect(count(empty)).toBeLessThan(count(root))
      expect(build(id, { reveal: true })).toBeNull()
      disposeBanquetDetails(root)
      disposeBanquetDetails(empty)
    }
  })

  it('keeps every new camera on a clear floor and describes it as a reconstruction', () => {
    expect(MANGA_CAMILLA_APARTMENT_VIEWS).toHaveLength(5)
    for (const view of MANGA_CAMILLA_APARTMENT_VIEWS) {
      const room = ship.spaces.get(view.spaceId)!
      expect(pointInPolygon(view.at, room.footprint), view.id).toBe(true)
      expect(view.staging).toEqual([])
      expect(view.labelFr).toContain('reconstitution')
      for (const item of plan.structures.filter(({ spaceId }) => spaceId === view.spaceId))
        expect(pointInPolygon(view.at, structureFootprint(item)), item.id).toBe(false)
    }
  })

  it('faces the seated diners towards the table and Musse towards his laptop, using the human +Z forward axis', () => {
    const towards = (
      person: { at: readonly [number, number]; heading?: number },
      target: readonly [number, number],
    ) => {
      const dx = target[0] - person.at[0],
        dz = target[1] - person.at[1],
        h = person.heading ?? 0
      return (dx * Math.sin(h) + dz * Math.cos(h)) / Math.hypot(dx, dz)
    }
    for (const diner of camillaDiningStaging)
      expect(towards(diner, [3.6, -2.7])).toBeGreaterThan(0.99)
    expect(towards(musseStaging[0], [0.55, -6.6])).toBeGreaterThan(0.99)
    const captain = camillaGuardStaging[0]
    for (const guard of camillaGuardStaging.slice(1))
      expect(towards(guard, captain.at)).toBeGreaterThan(0.5)
    expect(towards(captain, [0.8, 1.25])).toBeGreaterThan(0.9)
  })

  it('keeps dishes circular on a rectangular table, including after rotation', () => {
    const table = plan.structures.find(({ id }) => id.endsWith('-dining-table-07'))!
    for (const rotation of [0, 90]) {
      const into = new BanquetDetailBuilder(THREE),
        surface = new CamillaSurface(into, THREE, { structure: { ...table, rotation }, floor: 0 })
      surface.roundCylinder({ radius: 0.2, height: 0.012 }, [0, 0.7, 0], 0xffffff)
      const root = into.finish(),
        size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3())
      expect(size.x).toBeCloseTo(0.4, 5)
      expect(size.z).toBeCloseTo(0.4, 5)
      expect(size.y).toBeCloseTo(0.012, 5)
      disposeBanquetDetails(root)
    }
  })
})
