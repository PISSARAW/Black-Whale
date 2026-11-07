import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import { buildDiningHallDetails, DINING_HALL_SPACE } from './diningHallView'
import { MANGA_DINING_HALL_VIEWS } from './mangaDiningHallViews'
import { structureFootprint, pointInPolygon, polygonsOverlap } from './geometry'
import {
  diningHallFixtures,
  diningHallPoint,
  diningHallSpotAnchors,
  DINING_HALL_VIEWBOX,
} from '$lib/components/map/projection/diningHallPlan'

const ship = theShip()
const plan = ship.plans.get('tier-5')!
const room = ship.spaces.get(DINING_HALL_SPACE)!
const structures = plan.structures.filter(({ spaceId }) => spaceId === DINING_HALL_SPACE)
const build = (overrides = {}) =>
  buildDiningHallDetails({
    THREE,
    plan,
    spaceId: DINING_HALL_SPACE,
    reveal: false,
    ...overrides,
  })!

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('the central dining hall reconstructed from chapters 371, 377 and 379-380', () => {
  it('satisfies the shared blueprint invariants for the dining hall', () => {
    expect(validateBlueprint().filter((issue) => issue.includes(DINING_HALL_SPACE))).toEqual([])
  })

  it('keeps all floor structures within the room and clear of other collision solids', () => {
    const solids = structures.filter(({ base }) => base === 0)
    expect(solids.length).toBeGreaterThan(60)

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

  it('batches finite geometry within the envelope and the detail budget', () => {
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
    expect(bounds.max.y).toBeLessThanOrEqual(floor + room.ceiling! + 0.05)
    expect(bounds.min.x).toBeGreaterThanOrEqual(13.9)
    expect(bounds.max.x).toBeLessThanOrEqual(45.6)
    expect(bounds.min.z).toBeGreaterThanOrEqual(10.4)
    expect(bounds.max.z).toBeLessThanOrEqual(42.1)

    disposeBanquetDetails(root)
  })

  it('omits the interpretation in evidence mode and in unrelated rooms', () => {
    expect(build({ reveal: true })).toBeNull()
    expect(build({ spaceId: 'tier-5-hangar-entrance' })).toBeNull()
  })

  it('rebuilds the furnishings with the current plan instead of leaving ghosts behind', () => {
    const root = build()
    const withoutBenches = build({
      plan: {
        ...plan,
        structures: plan.structures.filter(
          ({ spaceId, kind }) => spaceId !== DINING_HALL_SPACE || kind !== 'seat',
        ),
      },
    })
    expect(triangles(withoutBenches)).toBeLessThan(triangles(root))

    const architectureOnly = build({
      plan: {
        ...plan,
        structures: plan.structures.filter(({ spaceId }) => spaceId !== DINING_HALL_SPACE),
      },
    })
    expect(triangles(architectureOnly)).toBeLessThan(triangles(withoutBenches))

    for (const object of [root, withoutBenches, architectureOnly]) disposeBanquetDetails(object)
  })

  it('keeps all manga camera anchors and character staging positions within the room and clear of solids', () => {
    const solids = structures.filter(({ base }) => base === 0)
    for (const view of MANGA_DINING_HALL_VIEWS) {
      expect(pointInPolygon(view.at, room.footprint)).toBe(true)
      for (const solid of solids) {
        expect(pointInPolygon(view.at, structureFootprint(solid)), `${view.id}/${solid.id}`).toBe(
          false,
        )
      }
      if (view.staging) {
        for (const actor of view.staging) {
          expect(pointInPolygon(actor.at, room.footprint), `${view.id}/${actor.characterId}`).toBe(
            true,
          )
        }
      }
    }
  })

  it('projects the same furnishings and spot anchors into the 2D map', () => {
    expect(diningHallFixtures.map(({ id }) => id)).toEqual(structures.map(({ id }) => id))
    const franklin = diningHallFixtures.find(({ id }) => id.endsWith('-franklin-table'))!
    const franklinPos = diningHallPoint(franklin.at)
    expect(diningHallSpotAnchors.occupants['franklin-bordeau']).toEqual({
      x: (franklinPos.x / DINING_HALL_VIEWBOX.width) * 100,
      y: (franklinPos.y / DINING_HALL_VIEWBOX.height) * 100,
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
