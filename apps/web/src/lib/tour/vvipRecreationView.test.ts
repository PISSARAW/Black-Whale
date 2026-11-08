import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { buildVvipRecreationDetails, VVIP_RECREATION_HALL } from './vvipRecreationView'
import { MANGA_VVIP_RECREATION_VIEWS } from './mangaVvipRecreationViews'
import { structureFootprint, pointInPolygon, polygonsOverlap } from './geometry'
import {
  vvipRecreationFixtures,
  vvipRecreationSpotAnchors,
  VVIP_RECREATION_VIEWBOX,
} from '$lib/components/map/projection/vvipRecreationPlan'

const ship = theShip()
const plan = ship.plans.get('tier-1')!
const room = ship.spaces.get(VVIP_RECREATION_HALL)!
const structures = plan.structures.filter(({ spaceId }) => spaceId === VVIP_RECREATION_HALL)
const fixture = (suffix: string) => structures.find(({ id }) => id.endsWith(suffix))!
const build = (overrides = {}) =>
  buildVvipRecreationDetails({
    THREE,
    plan,
    spaceId: VVIP_RECREATION_HALL,
    reveal: false,
    ...overrides,
  })!
const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('VVIP recreation hall reconstructed from chapter 419', () => {
  it('satisfies the shared blueprint invariants for VVIP recreation hall and gallery', () => {
    expect(validateBlueprint().filter((issue) => issue.includes(VVIP_RECREATION_HALL))).toEqual([])
  })

  it('holds double stair steps, galleries, billiards, sofas, bar counter and card tables', () => {
    const stairLeft01 = fixture('-left-stair-01')
    const stairRight01 = fixture('-right-stair-01')
    const rearGallery = fixture('-rear-gallery')
    const billiards01 = fixture('-billiards-table-01')
    const billiards02 = fixture('-billiards-table-02')
    const sofa01 = fixture('-lounge-sofa-01')
    const armchair01 = fixture('-lounge-armchair-01')
    const coffeeTable01 = fixture('-lounge-coffee-table-01')
    const barCounter = fixture('-bar-counter')
    const barBackShelf = fixture('-bar-back-shelf')
    const cardTable01 = fixture('-card-table-01')

    expect(stairLeft01.kind).toBe('platform')
    expect(stairRight01.kind).toBe('platform')
    expect(rearGallery.kind).toBe('platform')
    expect(billiards01.kind).toBe('table')
    expect(billiards02.kind).toBe('table')
    expect(sofa01.kind).toBe('seat')
    expect(armchair01.kind).toBe('seat')
    expect(coffeeTable01.kind).toBe('table')
    expect(barCounter.kind).toBe('cabinet')
    expect(barBackShelf.kind).toBe('cabinet')
    expect(cardTable01.kind).toBe('table')
  })

  it('keeps the floor furniture within the room and clear of other collision volumes', () => {
    const solids = structures.filter(({ base }) => base === 0)
    for (const solid of solids) {
      const footprint = structureFootprint(solid)
      expect(
        footprint.every((at) => pointInPolygon(at, room.footprint)),
        solid.id,
      ).toBe(true)
      for (const other of solids.filter(({ id }) => id > solid.id)) {
        expect(
          polygonsOverlap(footprint, structureFootprint(other)),
          `${solid.id}/${other.id}`,
        ).toBe(false)
      }
    }
  })

  it('batches finite geometry within the envelope and the banquet detail budget', () => {
    const root = build()
    expect(root.children.length).toBeGreaterThan(0)
    expect(root.children.length).toBeLessThanOrEqual(2)
    expect(triangles(root)).toBeLessThan(150_000)
    expect(root.children.some((child) => child instanceof THREE.Light)).toBe(false)
    for (const mesh of root.children as THREE.Mesh[]) {
      expect(Array.from(mesh.geometry.getAttribute('position').array).every(Number.isFinite)).toBe(
        true,
      )
    }
    const bounds = new THREE.Box3().setFromObject(root)
    const floor = floorOf(room, plan.tier)
    expect(bounds.min.y).toBeGreaterThanOrEqual(floor)
    expect(bounds.max.y).toBeLessThanOrEqual(floor + (room.ceiling ?? 8.0) + 0.1)
    expect(bounds.min.x).toBeGreaterThanOrEqual(25.8)
    expect(bounds.max.x).toBeLessThanOrEqual(56.2)
    expect(bounds.min.z).toBeGreaterThanOrEqual(-50.2)
    expect(bounds.max.z).toBeLessThanOrEqual(-24.8)
    disposeBanquetDetails(root)
  })

  it('omits the interpretation in evidence mode and in other rooms', () => {
    expect(build({ reveal: true })).toBeNull()
    expect(build({ spaceId: 'tier-1-banquet-hall' })).toBeNull()
  })

  it('rebuilds the ornament with the current furniture instead of leaving ghosts behind', () => {
    const root = build()
    const removed = build({
      plan: {
        ...plan,
        structures: plan.structures.filter(({ id }) => !id.includes('billiards-table')),
      },
    })
    expect(triangles(removed)).toBeLessThan(triangles(root))
    disposeBanquetDetails(root)
    disposeBanquetDetails(removed)
  })

  it('places every Chapter 419 manga view inside the room and clear of solid obstacles', () => {
    expect(MANGA_VVIP_RECREATION_VIEWS.length).toBe(3)
    const floorSolids = structures
      .filter(({ base }) => base === 0)
      .map((item) => structureFootprint(item))
    for (const mangaView of MANGA_VVIP_RECREATION_VIEWS) {
      expect(pointInPolygon(mangaView.at, room.footprint)).toBe(true)
      expect(floorSolids.some((solid) => pointInPolygon(mangaView.at, solid))).toBe(false)
    }
  })

  it('maps 2D local projection points inside the SVG viewBox', () => {
    expect(vvipRecreationFixtures.length).toBeGreaterThan(0)
    for (const item of vvipRecreationFixtures) {
      expect(item.point.x).toBeGreaterThanOrEqual(0)
      expect(item.point.x).toBeLessThanOrEqual(VVIP_RECREATION_VIEWBOX.width)
      expect(item.point.y).toBeGreaterThanOrEqual(0)
      expect(item.point.y).toBeLessThanOrEqual(VVIP_RECREATION_VIEWBOX.height)
    }
    const tserri = vvipRecreationSpotAnchors.occupants['prince-tserriednich']
    expect(tserri.x).toBeGreaterThan(0)
    expect(tserri.x).toBeLessThan(100)
    expect(tserri.y).toBeGreaterThan(0)
    expect(tserri.y).toBeLessThan(100)
  })

  it('disposes GPU buffers when tearing down the detail group', () => {
    const root = build()
    const geometries = (root.children as THREE.Mesh[]).map((mesh) => mesh.geometry)
    const materials = (root.children as THREE.Mesh[]).map((mesh) => mesh.material)
    const geoSpies = geometries.map((geo) => vi.spyOn(geo, 'dispose'))
    const matSpies = materials.map((mat) => vi.spyOn(mat as THREE.Material, 'dispose'))

    disposeBanquetDetails(root)

    geoSpies.forEach((spy) => expect(spy).toHaveBeenCalled())
    matSpies.forEach((spy) => expect(spy).toHaveBeenCalled())
  })
})
