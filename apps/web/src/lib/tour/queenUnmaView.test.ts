import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { buildQueenUnmaDetails, QUEEN_UNMA_ROOM } from './queenUnmaView'
import { MANGA_QUEEN_UNMA_VIEWS } from './mangaQueenUnmaViews'
import { structureFootprint, pointInPolygon, polygonsOverlap } from './geometry'
import {
  unmaFixtures,
  queenUnmaPoint,
  queenUnmaSpotAnchors,
  QUEEN_UNMA_VIEWBOX,
} from '$lib/components/map/projection/queenUnmaPlan'

const ship = theShip()
const plan = ship.plans.get('tier-1')!
const room = ship.spaces.get(QUEEN_UNMA_ROOM)!
const structures = plan.structures.filter(({ spaceId }) => spaceId === QUEEN_UNMA_ROOM)
const fixture = (suffix: string) => structures.find(({ id }) => id.endsWith(suffix))!
const build = (overrides = {}) =>
  buildQueenUnmaDetails({ THREE, plan, spaceId: QUEEN_UNMA_ROOM, reveal: false, ...overrides })!
const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('the room of Queen Unma reconstructed from chapter 403', () => {
  it('satisfies the shared blueprint invariants for Queen Unma’s room', () => {
    expect(validateBlueprint().filter((issue) => issue.includes(QUEEN_UNMA_ROOM))).toEqual([])
  })

  it('holds Queen Unma’s armchair, side tables, coffee table, crib and mobile in the blueprint', () => {
    const armchair = fixture('-armchair')
    const portTable = fixture('-side-table-port')
    const starTable = fixture('-side-table-starboard')
    const coffeeTable = fixture('-coffee-table')
    const crib = fixture('-crib')
    const mobile = fixture('-mobile')

    expect(armchair.kind).toBe('seat')
    expect(portTable.kind).toBe('table')
    expect(starTable.kind).toBe('table')
    expect(coffeeTable.kind).toBe('table')
    expect(crib.kind).toBe('bed')
    expect(mobile.kind).toBe('mobile')
    expect(structures.filter(({ kind }) => kind === 'painting')).toHaveLength(2)
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
    expect(bounds.max.y).toBeLessThanOrEqual(floor + (room.ceiling ?? 7.0) + 0.1)
    expect(bounds.min.x).toBeGreaterThanOrEqual(-72.1)
    expect(bounds.max.x).toBeLessThanOrEqual(-60.9)
    expect(bounds.min.z).toBeGreaterThanOrEqual(-50.1)
    expect(bounds.max.z).toBeLessThanOrEqual(-19.9)
    disposeBanquetDetails(root)
  })

  it('omits the interpretation in evidence mode and in other rooms', () => {
    expect(build({ reveal: true })).toBeNull()
    expect(build({ spaceId: 'tier-1-queens-living-quarters-room-02' })).toBeNull()
  })

  it('rebuilds the ornament with the current furniture instead of leaving ghosts behind', () => {
    const root = build()
    const removed = build({
      plan: { ...plan, structures: plan.structures.filter(({ id }) => !id.includes('armchair')) },
    })
    expect(triangles(removed)).toBeLessThan(triangles(root))
    const empty = build({ plan: { ...plan, structures: [] } })
    expect(triangles(empty)).toBeLessThan(triangles(removed))
    for (const object of [root, removed, empty]) disposeBanquetDetails(object)
  })

  it('places Queen Unma on her armchair in all three camera views clear of solids', () => {
    for (const v of MANGA_QUEEN_UNMA_VIEWS) {
      expect(pointInPolygon(v.at, room.footprint)).toBe(true)
      for (const solid of structures.filter(({ base }) => base === 0)) {
        expect(pointInPolygon(v.at, structureFootprint(solid)), `${v.id}/${solid.id}`).toBe(false)
      }
      const unma = v.staging!.find(({ characterId }) => characterId === 'unma-hui-guo-rou')!
      expect(unma.at).toEqual(fixture('-armchair').at)
    }
  })

  it('projects the room fixtures and Queen Unma’s spot into the 2D map', () => {
    expect(unmaFixtures.map(({ id }) => id)).toEqual(structures.map(({ id }) => id))
    const chair = queenUnmaPoint(fixture('-armchair').at)
    expect(queenUnmaSpotAnchors.occupants['unma-hui-guo-rou']).toEqual({
      x: (chair.x / QUEEN_UNMA_VIEWBOX.width) * 100,
      y: (chair.y / QUEEN_UNMA_VIEWBOX.height) * 100,
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
