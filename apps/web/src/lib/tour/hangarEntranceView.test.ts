import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { theShip, floorOf, ceilingOf, validateBlueprint } from './blueprint'
import { disposeBanquetDetails } from './banquetDetailBuilder'
import {
  buildHangarEntranceDetails,
  HANGAR_ENTRANCE_SPACE,
  hangarEntranceSurfacePlan,
} from './hangarEntranceView'
import { MANGA_GENERAL_VIEWS } from './mangaGeneralViews'
import { structureFootprint, pointInPolygon, polygonsOverlap } from './geometry'
import {
  hangarEntranceFixtures,
  hangarEntranceSpotAnchors,
} from '$lib/components/map/projection/hangarEntrancePlan'

const ship = theShip()
const plan = ship.plans.get('tier-5')!
const space = ship.spaces.get(HANGAR_ENTRANCE_SPACE)!
const structures = plan.structures.filter(({ spaceId }) => spaceId === HANGAR_ENTRANCE_SPACE)
const fixture = (suffix: string) =>
  plan.structures.find(({ id }) => id.startsWith('tier-5-hangar-') && id.endsWith(suffix))!

const build = (overrides = {}) =>
  buildHangarEntranceDetails({
    THREE,
    plan,
    spaceId: HANGAR_ENTRANCE_SPACE,
    reveal: false,
    ...overrides,
  })!

const triangles = (root: THREE.Group) =>
  (root.children as THREE.Mesh[]).reduce(
    (sum, mesh) => sum + mesh.geometry.getAttribute('position').count / 3,
    0,
  )

describe('the Tier 5 Hangar Entrance reconstructed from chapters 358, 377, 390 and 400', () => {
  it('satisfies the shared blueprint invariants for the hangar entrance', () => {
    expect(validateBlueprint().filter((issue) => issue.includes(HANGAR_ENTRANCE_SPACE))).toEqual([])
  })

  it('holds the blast gate, crane gantry rail, security guard post and cargo staging platforms', () => {
    const gate = fixture('-gate')
    const craneRail = fixture('-crane-rail')
    const guardPost = fixture('-guard-post')
    const stagingWest = fixture('-staging-west')
    const stagingEast = fixture('-staging-east')

    expect(gate.kind).toBe('platform')
    expect(gate.size[0]).toBe(10.0)
    expect(gate.size[1]).toBe(0.3)
    expect(gate.height).toBe(4.0)

    expect(craneRail.kind).toBe('platform')
    expect(craneRail.size[0]).toBe(24.0)
    expect(craneRail.base).toBe(4.0)

    expect(guardPost.kind).toBe('counter')
    expect(guardPost.size[0]).toBe(2.2)
    expect(guardPost.size[1]).toBe(1.2)

    expect(stagingWest.kind).toBe('table')
    expect(stagingWest.size[0]).toBe(4.8)

    expect(stagingEast.kind).toBe('table')
    expect(stagingEast.size[0]).toBe(3.2)
  })

  it('keeps solid floor furniture within the hangar entrance and clear of other collision volumes', () => {
    const solids = structures.filter(({ base }) => base === 0)
    for (const solid of solids) {
      const footprint = structureFootprint(solid)
      expect(
        footprint.every((at) => pointInPolygon(at, space.footprint)),
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

  it('batches finite geometry within the envelope and high-detail budget', () => {
    const root = build()
    expect(root.children.length).toBeGreaterThan(0)
    expect(root.children.length).toBeLessThanOrEqual(2)
    expect(triangles(root)).toBeGreaterThan(8_000)
    expect(triangles(root)).toBeLessThan(200_000)
    expect(root.children.some((child) => child instanceof THREE.Light)).toBe(false)

    for (const mesh of root.children as THREE.Mesh[]) {
      expect(Array.from(mesh.geometry.getAttribute('position').array).every(Number.isFinite)).toBe(
        true,
      )
    }

    const bounds = new THREE.Box3().setFromObject(root)
    const floor = floorOf(space, plan.tier)
    expect(bounds.min.y).toBeGreaterThanOrEqual(floor - 0.05)
    expect(bounds.max.y).toBeLessThanOrEqual(floor + ceilingOf(space, plan.tier) + 0.5)
    disposeBanquetDetails(root)
  })

  it('omits details in reveal mode and ignores unrelated spaces', () => {
    expect(build({ reveal: true })).toBeNull()
    expect(build({ spaceId: 'tier-5-warehouse' })).toBeNull()
  })

  it('places camera views within the hangar entrance footprint and clear of solids', () => {
    const hangarViews = MANGA_GENERAL_VIEWS.filter((v) => v.spaceId === HANGAR_ENTRANCE_SPACE)
    expect(hangarViews.length).toBeGreaterThanOrEqual(1)

    for (const v of hangarViews) {
      expect(pointInPolygon(v.at, space.footprint)).toBe(true)
      const solids = plan.structures.filter(
        (s) => s.spaceId === HANGAR_ENTRANCE_SPACE && s.base === 0,
      )
      for (const solid of solids) {
        expect(pointInPolygon(v.at, structureFootprint(solid)), `${v.id}/${solid.id}`).toBe(false)
      }
    }
  })

  it('projects hangar entrance fixtures and spot anchors correctly into 2D local map', () => {
    expect(hangarEntranceFixtures.length).toBeGreaterThan(0)
    const gateSpot = hangarEntranceSpotAnchors.gate
    expect(gateSpot.x).toBeGreaterThan(0)
    expect(gateSpot.x).toBeLessThan(100)
    expect(gateSpot.y).toBeGreaterThan(0)
    expect(gateSpot.y).toBeLessThan(100)

    const guardSpot = hangarEntranceSpotAnchors.guardPost
    expect(guardSpot.x).toBeGreaterThan(0)
    expect(guardSpot.x).toBeLessThan(100)

    const inspector = hangarEntranceSpotAnchors.occupants.inspector
    expect(inspector.x).toBeGreaterThan(0)
    expect(inspector.x).toBeLessThan(100)
    expect(inspector.y).toBeGreaterThan(0)
    expect(inspector.y).toBeLessThan(100)
  })

  it('filters out hangar entrance structures from walked surface plan except in reveal mode', () => {
    const normalPlan = hangarEntranceSurfacePlan(plan, false)
    expect(normalPlan.structures.some((s) => s.spaceId === HANGAR_ENTRANCE_SPACE)).toBe(false)

    const revealedPlan = hangarEntranceSurfacePlan(plan, true)
    expect(revealedPlan.structures.some((s) => s.spaceId === HANGAR_ENTRANCE_SPACE)).toBe(true)
  })

  it('releases GPU resources when details are disposed', () => {
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
