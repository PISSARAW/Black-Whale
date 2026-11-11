import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildRoyalSalonDetails,
  ROYAL_SALON,
  ROYAL_VESTIBULE,
  royalSalonSurfacePlan,
} from './royalSalonView'
import { MANGA_ROYAL_SALON_VIEWS } from './mangaRoyalSalonViews'
import { structureFootprint, pointInPolygon, polygonsOverlap } from './geometry'
import {
  salonFixtures,
  salonPoint,
  salonSpotAnchors,
  SALON_VIEWBOX,
} from '$lib/components/map/projection/royalSalonPlan'

const ship = theShip()
const plan = ship.plans.get('interior-king-quarters')!
const room = ship.spaces.get(ROYAL_SALON)!
const structures = plan.structures.filter(({ spaceId }) => spaceId === ROYAL_SALON)
const fixture = (suffix: string) => structures.find(({ id }) => id.endsWith(suffix))!
const build = (overrides = {}) =>
  buildRoyalSalonDetails({ THREE, plan, spaceId: ROYAL_SALON, reveal: false, ...overrides })!
const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('the royal salon reconstructed from chapter 382', () => {
  it('satisfies the shared blueprint invariants for the royal salon', () => {
    expect(validateBlueprint().filter((issue) => issue.includes(ROYAL_SALON))).toEqual([])
  })

  it('separates the landscape from the perpendicular battle painting and mantel', () => {
    const landscape = fixture('-landscape-panel')
    const battle = fixture('-great-window')
    const mantel = fixture('-mantel')
    expect(landscape.kind).toBe('painting')
    expect(landscape.size[0]).toBeGreaterThan(landscape.size[1])
    expect(battle.size[1]).toBeGreaterThan(battle.size[0])
    expect(mantel.at[1]).toBe(battle.at[1])
    expect(mantel.height).toBeLessThan(battle.base)
    expect(structures.filter(({ kind }) => kind === 'window')).toHaveLength(0)
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
    expect(bounds.max.y).toBeLessThanOrEqual(floor + room.ceiling!)
    expect(bounds.min.x).toBeGreaterThanOrEqual(-12.06)
    expect(bounds.max.x).toBeLessThanOrEqual(12.06)
    expect(bounds.min.z).toBeGreaterThanOrEqual(-8.38)
    expect(bounds.max.z).toBeLessThanOrEqual(8.38)
    disposeBanquetDetails(root)
  })

  it('omits the interpretation in evidence mode and in other rooms', () => {
    expect(build({ reveal: true })).toBeNull()
    expect(build({ spaceId: 'tier-1-banquet-hall' })).toBeNull()
    expect(build({ spaceId: ROYAL_VESTIBULE, reveal: true })).toBeNull()
    const vestibule = build({ spaceId: ROYAL_VESTIBULE })
    expect(vestibule.children.length).toBeGreaterThan(0)
    disposeBanquetDetails(vestibule)
  })

  it('rebuilds the ornament with the current furniture instead of leaving ghosts behind', () => {
    const root = build()
    const removed = build({
      plan: { ...plan, structures: plan.structures.filter(({ kind }) => kind !== 'cabinet') },
    })
    expect(triangles(removed)).toBeLessThan(triangles(root))
    // Removing all furniture leaves precisely the architectural finish.
    const empty = build({ plan: { ...plan, structures: [] } })
    expect(triangles(empty)).toBeLessThan(triangles(removed))
    for (const object of [root, removed, empty]) disposeBanquetDetails(object)
  })

  it('centres the king on the landscape axis and keeps all nine camera anchors clear', () => {
    const chaise = fixture('-royal-chaise')
    const landscape = fixture('-landscape-panel')
    expect(chaise.at[0]).toBe(0)
    expect(landscape.at[0]).toBe(0)
    expect(fixture('-floor-speaker').at[0]).toBe(-fixture('-floor-speaker-starboard').at[0])
    for (const view of MANGA_ROYAL_SALON_VIEWS) {
      expect(pointInPolygon(view.at, ship.spaces.get(view.spaceId)!.footprint), view.id).toBe(true)
      for (const solid of structures.filter(({ base }) => base === 0)) {
        expect(pointInPolygon(view.at, structureFootprint(solid)), `${view.id}/${solid.id}`).toBe(
          false,
        )
      }
      const king = view.staging?.find(({ characterId }) => characterId === 'nasubi-hui-guo-rou')
      if (king) expect(king.at).toEqual(chaise.at)
      else expect(view.staging).toEqual([])
    }
  })

  it('projects the same furnishings and royal chair into the 2D map', () => {
    expect(salonFixtures.map(({ id }) => id)).toEqual(structures.map(({ id }) => id))
    const chair = salonPoint(fixture('-royal-chaise').at)
    expect(salonSpotAnchors.occupants['nasubi-hui-guo-rou']).toEqual({
      x: (chair.x / SALON_VIEWBOX.width) * 100,
      y: (chair.y / SALON_VIEWBOX.height) * 100,
    })
  })

  it('removes the unsupported funeral bier and hides replaced blocks without changing collisions', () => {
    expect(structures.some((s) => s.id.endsWith('-bier'))).toBe(false)
    expect(royalSalonSurfacePlan(plan, false).structures).toEqual([])
    expect(royalSalonSurfacePlan(plan, true)).toBe(plan)
    expect(plan.structures).toEqual(structures)
    expect(fixture('-long-table').height).toBeLessThan(0.6)
    expect(MANGA_ROYAL_SALON_VIEWS).toHaveLength(9)
    expect(MANGA_ROYAL_SALON_VIEWS.filter((v) => v.staging?.length)).toHaveLength(3)
    for (const v of MANGA_ROYAL_SALON_VIEWS)
      expect(v.beastStaging).toContainEqual({ ownerId: 'nasubi-hui-guo-rou', omit: true })
    expect(salonSpotAnchors.occupants['prince-halkenburg']).toEqual({
      x: (salonPoint([-3.2, 2.15]).x / SALON_VIEWBOX.width) * 100,
      y: (salonPoint([-3.2, 2.15]).y / SALON_VIEWBOX.height) * 100,
    })
  })

  it('releases the GPU resources when the room is unloaded', () => {
    const root = build()
    const parent = new THREE.Group()
    parent.add(root)
    const resources = (root.children as THREE.Mesh[]).flatMap((mesh) => [
      mesh.geometry,
      mesh.material as THREE.Material,
    ])
    const dispose = resources.map((resource) => vi.spyOn(resource, 'dispose'))
    disposeBanquetDetails(root)
    expect(root.parent).toBeNull()
    for (const spy of dispose) expect(spy).toHaveBeenCalledOnce()
  })
})
