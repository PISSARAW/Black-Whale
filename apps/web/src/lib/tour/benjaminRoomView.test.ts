import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { buildBenjaminRoomDetails, BENJAMIN_ROOM_SPACE } from './benjaminRoomView'
import { MANGA_BENJAMIN_ROOM_VIEWS } from './mangaBenjaminRoomViews'
import { structureFootprint, pointInPolygon, polygonsOverlap } from './geometry'
import {
  benjaminFixtures,
  benjaminSpotAnchors,
} from '$lib/components/map/projection/benjaminRoomPlan'

const ship = theShip()
const plan = ship.plans.get('interior-room-1001')!
const room = ship.spaces.get(BENJAMIN_ROOM_SPACE)!
const structures = plan.structures.filter(({ spaceId }) => spaceId === BENJAMIN_ROOM_SPACE)
const fixture = (suffix: string) => structures.find(({ id }) => id.endsWith(suffix))!
const build = (overrides = {}) =>
  buildBenjaminRoomDetails({
    THREE,
    plan,
    spaceId: BENJAMIN_ROOM_SPACE,
    reveal: false,
    ...overrides,
  })!
const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('the room of Prince Benjamin reconstructed from chapters 362, 363 and 366', () => {
  it('satisfies the shared blueprint invariants for Benjamin’s room', () => {
    expect(validateBlueprint().filter((issue) => issue.includes(BENJAMIN_ROOM_SPACE))).toEqual([])
  })

  it('holds Benjamin’s reception painting and command telephone in the blueprint', () => {
    const painting = fixture('-reception-painting')
    const telephone = fixture('-telephone')
    expect(painting.kind).toBe('painting')
    expect(painting.size[0]).toBeGreaterThan(painting.size[1])
    expect(telephone.kind).toBe('telephone')
    expect(telephone.base).toBeGreaterThan(0.5)
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
    expect(bounds.min.y).toBeGreaterThanOrEqual(floor - 0.05)
    expect(bounds.max.y).toBeLessThanOrEqual(floor + room.ceiling! + 0.25)
    disposeBanquetDetails(root)
  })

  it('omits the interpretation in evidence mode and in other rooms', () => {
    expect(build({ reveal: true })).toBeNull()
    expect(build({ spaceId: 'tier-1-royal-residential-sector-room-1001-bedroom' })).toBeNull()
  })

  it('rebuilds the ornament with the current furniture instead of leaving ghosts behind', () => {
    const root = build()
    const removed = build({
      plan: { ...plan, structures: plan.structures.filter(({ kind }) => kind !== 'telephone') },
    })
    expect(triangles(removed)).toBeLessThan(triangles(root))
    const empty = build({ plan: { ...plan, structures: [] } })
    expect(triangles(empty)).toBeLessThan(triangles(removed))
    for (const object of [root, removed, empty]) disposeBanquetDetails(object)
  })

  it('places Prince Benjamin and Balsamilco in all camera views clear of solids', () => {
    for (const view of MANGA_BENJAMIN_ROOM_VIEWS) {
      expect(pointInPolygon(view.at, room.footprint)).toBe(true)
      for (const solid of structures.filter(({ base }) => base === 0)) {
        expect(pointInPolygon(view.at, structureFootprint(solid)), `${view.id}/${solid.id}`).toBe(
          false,
        )
      }
      const benjamin = view.staging!.find(({ characterId }) => characterId === 'prince-benjamin')!
      expect(pointInPolygon(benjamin.at, room.footprint)).toBe(true)
      const balsamilco = view.staging!.find(
        ({ characterId }) => characterId === 'balsamilco-might',
      )!
      expect(pointInPolygon(balsamilco.at, room.footprint)).toBe(true)
    }
  })

  it('projects the room fixtures and Benjamin’s spot into the 2D map', () => {
    expect(benjaminFixtures.map(({ id }) => id)).toEqual(structures.map(({ id }) => id))
    const pSpot = benjaminSpotAnchors.occupants['prince-benjamin']
    expect(pSpot.x).toBeGreaterThan(0)
    expect(pSpot.x).toBeLessThan(100)
    expect(pSpot.y).toBeGreaterThan(0)
    expect(pSpot.y).toBeLessThan(100)
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
